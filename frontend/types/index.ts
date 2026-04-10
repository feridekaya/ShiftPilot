export type Role = 'manager' | 'supervisor' | 'employee';
export type Gender = 'male' | 'female';
export type AssignmentStatus = 'pending' | 'completed' | 'approved' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Frequency = 'multiple_daily' | 'interval_daily' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TaskCategory = 'opening' | 'closing' | 'responsibility' | 'general' | 'special';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  gender: Gender | null;
  is_active: boolean;
  created_at: string;
}

export interface Zone {
  id: number;
  name: string;
  description: string;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
}

export interface TaskSchedule {
  id: number;
  frequency: Frequency;
  times_per_day: number;
  interval_hours: number | null;
  days_of_week: number[];
  month_day: number | null;
  month: number | null;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  zone: Zone | null;
  requires_photo: boolean;
  coefficient: number;
  allowed_roles: Role[];
  allowed_genders: Gender | null;
  created_by: string;
  schedule: TaskSchedule | null;
  permanent_assignees: { id: number; name: string; role: Role; gender: Gender | null }[];
}

export interface SubmissionPhoto {
  id: number;
  photo_url: string;
  order: number;
}

export interface SubmissionHistoryItem {
  id: number;
  submitted_at: string;
  approval_status: ApprovalStatus;
  note: string;
  staff_note: string;
  photo_url: string;
  photos: SubmissionPhoto[];
  approved_by: string | null;
}

export interface Assignment {
  id: number;
  user: User;
  task: Task;
  shift: Shift | null;
  zone: Zone | null;
  date: string;
  status: AssignmentStatus;
  coefficient_share: number | null;
  assigned_by: User | null;
  submissions: SubmissionHistoryItem[];
}

export interface TaskSubmission {
  id: number;
  assignment: {
    id: number;
    user: User;
    task_title: string;
    task_description: string;
    task_category: TaskCategory;
    zone_name: string | null;
    shift_name: string | null;
    date: string;
    status: AssignmentStatus;
  };
  photo_url: string;
  photos: SubmissionPhoto[];
  staff_note: string;
  submitted_at: string;
  approved_by: User | null;
  approval_status: ApprovalStatus;
  note: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  id: number;
  name: string;
  role: Role;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  gender: Gender | null;
}
