export interface Task {
  rowIndex: number;
  majorCategory: string;
  minorCategory: string;
  task: string;
  dueDate: string;
  status: string;
}

export interface Category {
  rowIndex: number;
  majorCategory: string;
  minorCategory: string;
}

export type ViewMode = 'tasks' | 'categories';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
