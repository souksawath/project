export type TaskStatus = 'not_started' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  wbs: string;
  name: string;
  parentId: string | null;
  assigneeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // in days
  progress: number; // 0 to 100
  status: TaskStatus;
  priority: TaskPriority;
  notes?: string;
  isMilestone?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
  capacityHoursPerWeek: number; // e.g. 40
  hourlyRate?: number;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  startDate: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastSyncedAt?: string;
}

export type ViewMode = 'gantt' | 'table' | 'resources' | 'board' | 'analytics';
export type ZoomLevel = 'day' | 'week' | 'month';
export type Language = 'la' | 'en';
