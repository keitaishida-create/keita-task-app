import { useState, useEffect, useMemo } from 'react';
import type { Task, Category } from '../types';

interface Props {
  task: Task | null; // null = 新規追加
  categories: Category[];
  statuses: string[];
  onSave: (task: Task | Omit<Task, 'rowIndex'>) => void;
  onCancel: () => void;
}

export function TaskForm({ task, categories, statuses, onSave, onCancel }: Props) {
  const [majorCategory, setMajorCategory] = useState(task?.majorCategory || '');
  const [minorCategory, setMinorCategory] = useState(task?.minorCategory || '');
  const [taskName, setTaskName] = useState(task?.task || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [status, setStatus] = useState(task?.status || '未着手');

  // 大カテゴリ一覧（ユニーク）
  const majorCategories = useMemo(() => {
    return [...new Set(categories.map(c => c.majorCategory))];
  }, [categories]);

  // 選択中の大カテゴリに対応する小カテゴリ一覧
  const minorCategories = useMemo(() => {
    return categories
      .filter(c => c.majorCategory === majorCategory)
      .map(c => c.minorCategory);
  }, [categories, majorCategory]);

  // 大カテゴリ変更時に小カテゴリをリセット
  useEffect(() => {
    if (!task && minorCategories.length > 0 && !minorCategories.includes(minorCategory)) {
      setMinorCategory(minorCategories[0]);
    }
  }, [majorCategory, minorCategories, minorCategory, task]);

  // 初期値セット
  useEffect(() => {
    if (!task && majorCategories.length > 0 && !majorCategory) {
      setMajorCategory(majorCategories[0]);
    }
  }, [majorCategories, majorCategory, task]);

  // 期日をinput[type=date]用に変換
  const dueDateForInput = useMemo(() => {
    if (!dueDate) return '';
    const m = dueDate.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (m) {
      const year = new Date().getFullYear();
      return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    }
    return dueDate;
  }, [dueDate]);

  const handleDueDateChange = (val: string) => {
    if (!val) { setDueDate(''); return; }
    // YYYY-MM-DD → M/D
    const parts = val.split('-');
    if (parts.length === 3) {
      setDueDate(`${parseInt(parts[1])}/${parseInt(parts[2])}`);
    } else {
      setDueDate(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const data = {
      majorCategory,
      minorCategory,
      task: taskName.trim(),
      dueDate,
      status,
    };

    if (task) {
      onSave({ ...data, rowIndex: task.rowIndex });
    } else {
      onSave(data);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2>{task ? 'タスク編集' : 'タスク追加'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            大カテゴリ
            <select value={majorCategory} onChange={e => setMajorCategory(e.target.value)}>
              {majorCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            小カテゴリ
            <select value={minorCategory} onChange={e => setMinorCategory(e.target.value)}>
              {minorCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            タスク名
            <input
              type="text"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="タスク名を入力"
              required
              autoFocus
            />
          </label>

          <label>
            期日
            <input
              type="date"
              value={dueDateForInput}
              onChange={e => handleDueDateChange(e.target.value)}
            />
          </label>

          <label>
            ステータス
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>キャンセル</button>
            <button type="submit" className="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
