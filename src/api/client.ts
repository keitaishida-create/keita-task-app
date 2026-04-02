import type { Task, Category, ApiResponse } from '../types';

const STORAGE_KEY_TOKEN = 'gas_api_token';
const STORAGE_KEY_URL = 'gas_api_url';
const CACHE_KEY_TASKS = 'cached_tasks';
const CACHE_KEY_CATEGORIES = 'cached_categories';
const CACHE_KEY_STATUSES = 'cached_statuses';

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function getStoredUrl(): string | null {
  return localStorage.getItem(STORAGE_KEY_URL);
}

export function saveCredentials(url: string, token: string) {
  localStorage.setItem(STORAGE_KEY_URL, url);
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_URL);
}

export function isLoggedIn(): boolean {
  return !!getStoredToken() && !!getStoredUrl();
}

// オフラインキャッシュ
function cacheData(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota exceeded — 無視 */ }
}

function getCachedData<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function apiCall<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  const url = getStoredUrl();
  const token = getStoredToken();
  if (!url || !token) throw new Error('未ログイン');

  const payload = { ...body, action, token };

  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain' },
    redirect: 'follow',
  });

  const text = await res.text();
  const json: ApiResponse<T> = JSON.parse(text);

  if (!json.success) {
    throw new Error(json.error || 'APIエラー');
  }

  return json.data as T;
}

// タスク
export async function fetchTasks(): Promise<Task[]> {
  try {
    const tasks = await apiCall<Task[]>('getTasks');
    cacheData(CACHE_KEY_TASKS, tasks);
    return tasks;
  } catch (e) {
    if (!navigator.onLine) {
      const cached = getCachedData<Task[]>(CACHE_KEY_TASKS);
      if (cached) return cached;
    }
    throw e;
  }
}

export async function addTask(task: Omit<Task, 'rowIndex'>): Promise<Task[]> {
  const tasks = await apiCall<Task[]>('addTask', task as unknown as Record<string, unknown>);
  cacheData(CACHE_KEY_TASKS, tasks);
  return tasks;
}

export async function updateTask(task: Task): Promise<Task[]> {
  const tasks = await apiCall<Task[]>('updateTask', task as unknown as Record<string, unknown>);
  cacheData(CACHE_KEY_TASKS, tasks);
  return tasks;
}

export async function deleteTask(rowIndex: number): Promise<Task[]> {
  const tasks = await apiCall<Task[]>('deleteTask', { rowIndex });
  cacheData(CACHE_KEY_TASKS, tasks);
  return tasks;
}

// カテゴリ
export async function fetchCategories(): Promise<Category[]> {
  try {
    const cats = await apiCall<Category[]>('getCategories');
    cacheData(CACHE_KEY_CATEGORIES, cats);
    return cats;
  } catch (e) {
    if (!navigator.onLine) {
      const cached = getCachedData<Category[]>(CACHE_KEY_CATEGORIES);
      if (cached) return cached;
    }
    throw e;
  }
}

export async function addCategory(majorCategory: string, minorCategory: string): Promise<Category[]> {
  const cats = await apiCall<Category[]>('addCategory', { majorCategory, minorCategory });
  cacheData(CACHE_KEY_CATEGORIES, cats);
  return cats;
}

export async function deleteCategory(rowIndex: number): Promise<Category[]> {
  const cats = await apiCall<Category[]>('deleteCategory', { rowIndex });
  cacheData(CACHE_KEY_CATEGORIES, cats);
  return cats;
}

// ステータス
export async function fetchStatuses(): Promise<string[]> {
  try {
    const statuses = await apiCall<string[]>('getStatuses');
    cacheData(CACHE_KEY_STATUSES, statuses);
    return statuses;
  } catch (e) {
    if (!navigator.onLine) {
      const cached = getCachedData<string[]>(CACHE_KEY_STATUSES);
      if (cached) return cached;
    }
    throw e;
  }
}

// 認証テスト
export async function testAuth(url: string, token: string): Promise<boolean> {
  const payload = { action: 'getStatuses', token };
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain' },
    redirect: 'follow',
  });
  const text = await res.text();
  const json: ApiResponse<string[]> = JSON.parse(text);
  return json.success === true;
}
