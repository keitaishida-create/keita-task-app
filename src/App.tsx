import { useState, useCallback } from 'react';
import { isLoggedIn, clearCredentials } from './api/client';
import { useTasks } from './hooks/useTasks';
import { useOffline } from './hooks/useOffline';
import { LoginScreen } from './components/LoginScreen';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { CategoryManager } from './components/CategoryManager';
import { OfflineBanner } from './components/OfflineBanner';
import type { Task, ViewMode } from './types';
import './App.css';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [view, setView] = useState<ViewMode>('tasks');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const isOffline = useOffline();

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return <MainApp
    view={view}
    setView={setView}
    editingTask={editingTask}
    setEditingTask={setEditingTask}
    showAddForm={showAddForm}
    setShowAddForm={setShowAddForm}
    isOffline={isOffline}
    onLogout={() => { clearCredentials(); setLoggedIn(false); }}
  />;
}

interface MainAppProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  editingTask: Task | null;
  setEditingTask: (t: Task | null) => void;
  showAddForm: boolean;
  setShowAddForm: (v: boolean) => void;
  isOffline: boolean;
  onLogout: () => void;
}

function MainApp({
  view, setView, editingTask, setEditingTask,
  showAddForm, setShowAddForm, isOffline, onLogout,
}: MainAppProps) {
  const {
    tasks, categories, statuses, loading, error, reload,
    addTask, updateTask, deleteTask, addCategory, deleteCategory,
  } = useTasks();

  const handleSaveTask = useCallback(async (data: Task | Omit<Task, 'rowIndex'>) => {
    try {
      if ('rowIndex' in data) {
        await updateTask(data);
      } else {
        await addTask(data);
      }
      setEditingTask(null);
      setShowAddForm(false);
    } catch { /* error は useTasks が管理 */ }
  }, [updateTask, addTask, setEditingTask, setShowAddForm]);

  const handleDeleteTask = useCallback(async (rowIndex: number) => {
    if (!confirm('このタスクを削除しますか？')) return;
    try {
      await deleteTask(rowIndex);
    } catch { /* error は useTasks が管理 */ }
  }, [deleteTask]);

  return (
    <div className="app">
      {isOffline && <OfflineBanner />}

      <header className="app-header">
        <h1>Task Manager</h1>
        <div className="header-actions">
          <button className="icon-btn" onClick={reload} title="更新">↻</button>
          <button className="icon-btn" onClick={onLogout} title="ログアウト">⏻</button>
        </div>
      </header>

      {error && <div className="error-bar">{error}</div>}
      {loading && <div className="loading-bar">読み込み中...</div>}

      <main className="app-main">
        {view === 'tasks' ? (
          <TaskList
            tasks={tasks}
            statuses={statuses}
            isOffline={isOffline}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />
        ) : (
          <CategoryManager
            categories={categories}
            isOffline={isOffline}
            onAdd={addCategory}
            onDelete={deleteCategory}
          />
        )}
      </main>

      {view === 'tasks' && !isOffline && (
        <button className="fab" onClick={() => setShowAddForm(true)}>+</button>
      )}

      {(showAddForm || editingTask) && (
        <TaskForm
          task={editingTask}
          categories={categories}
          statuses={statuses}
          onSave={handleSaveTask}
          onCancel={() => { setEditingTask(null); setShowAddForm(false); }}
        />
      )}

      <nav className="bottom-nav">
        <button
          className={`nav-btn ${view === 'tasks' ? 'active' : ''}`}
          onClick={() => setView('tasks')}
        >
          <span className="nav-icon">☰</span>
          <span>タスク</span>
        </button>
        <button
          className={`nav-btn ${view === 'categories' ? 'active' : ''}`}
          onClick={() => setView('categories')}
        >
          <span className="nav-icon">◫</span>
          <span>カテゴリ</span>
        </button>
      </nav>
    </div>
  );
}
