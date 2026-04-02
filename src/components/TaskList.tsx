import { useState, useMemo } from 'react';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  statuses: string[];
  isOffline: boolean;
  onEdit: (task: Task) => void;
  onDelete: (rowIndex: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  '未着手': '#9e9e9e',
  '実行中': '#1976d2',
  '完了': '#388e3c',
  'キャンセル': '#c62828',
  '外部依頼中': '#f57c00',
};

function isDueToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return false;
  const now = new Date();
  return parseInt(m[1]) === now.getMonth() + 1 && parseInt(m[2]) === now.getDate();
}

function isDuePast(dateStr: string): boolean {
  if (!dateStr) return false;
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(now.getFullYear(), parseInt(m[1]) - 1, parseInt(m[2]));
  return d < now;
}

export function TaskList({ tasks, statuses, isOffline, onEdit, onDelete }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // フィルタリング
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    if (statusFilter === 'active') return tasks.filter(t => t.status !== '完了' && t.status !== 'キャンセル');
    return tasks.filter(t => t.status === statusFilter);
  }, [tasks, statusFilter]);

  // 大カテゴリでグルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    filteredTasks.forEach(t => {
      const list = map.get(t.majorCategory) || [];
      list.push(t);
      map.set(t.majorCategory, list);
    });
    return map;
  }, [filteredTasks]);

  // 初回は全展開
  useMemo(() => {
    if (expandedCategories.size === 0 && grouped.size > 0) {
      setExpandedCategories(new Set(grouped.keys()));
    }
  }, [grouped, expandedCategories.size]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="task-list">
      {/* フィルタ */}
      <div className="filter-bar">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="active">未完了</option>
          <option value="all">すべて</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="task-count">{filteredTasks.length}件</span>
      </div>

      {/* タスク一覧 */}
      {Array.from(grouped.entries()).map(([category, categoryTasks]) => (
        <div key={category} className="category-group">
          <div className="category-header" onClick={() => toggleCategory(category)}>
            <span className="category-toggle">{expandedCategories.has(category) ? '▼' : '▶'}</span>
            <span className="category-name">{category}</span>
            <span className="category-count">{categoryTasks.length}</span>
          </div>
          {expandedCategories.has(category) && (
            <div className="category-tasks">
              {categoryTasks.map(task => (
                <div
                  key={task.rowIndex}
                  className={`task-card ${isDuePast(task.dueDate) && task.status !== '完了' && task.status !== 'キャンセル' ? 'overdue' : ''}`}
                  onClick={() => !isOffline && onEdit(task)}
                >
                  <div className="task-top">
                    <span className="task-minor">{task.minorCategory}</span>
                    <span
                      className="task-status"
                      style={{ backgroundColor: STATUS_COLORS[task.status] || '#757575' }}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="task-name">{task.task}</div>
                  <div className="task-bottom">
                    <span className={`task-due ${isDueToday(task.dueDate) ? 'due-today' : ''}`}>
                      {task.dueDate ? `期日: ${task.dueDate}` : '期日なし'}
                    </span>
                    {!isOffline && (
                      <button
                        className="task-delete-btn"
                        onClick={e => { e.stopPropagation(); onDelete(task.rowIndex); }}
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {filteredTasks.length === 0 && (
        <div className="empty-state">タスクがありません</div>
      )}
    </div>
  );
}
