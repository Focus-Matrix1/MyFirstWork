
export type QuadrantId = 'q1' | 'q2' | 'q3' | 'q4';
export type CategoryId = 'inbox' | QuadrantId;

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: CategoryId;
  createdAt: number;
  completed: boolean;
  completedAt?: number; // Timestamp when task was completed
  plannedDate?: string; // Format: YYYY-MM-DD
  duration?: string; // e.g. "30m", "1h"
}

export type ViewState = 'matrix' | 'list' | 'stats' | 'user';

export interface DragItem {
  task: Task;
  initialX: number;
  initialY: number;
  offsetX: number;
  offsetY: number;
}
