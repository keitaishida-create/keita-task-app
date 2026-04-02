import { useState, useMemo } from 'react';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  isOffline: boolean;
  onAdd: (major: string, minor: string) => void;
  onDelete: (rowIndex: number) => void;
}

export function CategoryManager({ categories, isOffline, onAdd, onDelete }: Props) {
  const [newMajor, setNewMajor] = useState('');
  const [newMinor, setNewMinor] = useState('');
  const [showForm, setShowForm] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.forEach(c => {
      const list = map.get(c.majorCategory) || [];
      list.push(c);
      map.set(c.majorCategory, list);
    });
    return map;
  }, [categories]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMajor.trim() || !newMinor.trim()) return;
    onAdd(newMajor.trim(), newMinor.trim());
    setNewMajor('');
    setNewMinor('');
    setShowForm(false);
  };

  return (
    <div className="category-manager">
      <div className="section-header">
        <h2>カテゴリ管理</h2>
        {!isOffline && (
          <button className="btn-small" onClick={() => setShowForm(!showForm)}>
            {showForm ? '閉じる' : '+ 追加'}
          </button>
        )}
      </div>

      {showForm && (
        <form className="category-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="大カテゴリ"
            value={newMajor}
            onChange={e => setNewMajor(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="小カテゴリ"
            value={newMinor}
            onChange={e => setNewMinor(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">追加</button>
        </form>
      )}

      {Array.from(grouped.entries()).map(([major, items]) => (
        <div key={major} className="cat-group">
          <div className="cat-major">{major}</div>
          {items.map(c => (
            <div key={c.rowIndex} className="cat-item">
              <span>{c.minorCategory}</span>
              {!isOffline && (
                <button
                  className="cat-delete-btn"
                  onClick={() => {
                    if (confirm(`「${c.majorCategory} > ${c.minorCategory}」を削除しますか？`)) {
                      onDelete(c.rowIndex);
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
