export type Role = 'manager' | 'supervisor' | 'employee';
export type Gender = 'male' | 'female';
export type AssignmentStatus = 'pending' | 'completed' | 'approved' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Frequency = 'daily' | 'weekly' | 'monthly';

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

export interface Task {
  id: number;
  title: string;
  description: string;
  zone: Zone | null;
  requires_photo: boolean;
  coefficient: number;
  allowed_roles: Role[];
  allowed_genders: Gender | null;
  created_by: string;
}

export interface TaskSchedule {
  id: number;
  task: Task;
  frequency: Frequency;
  days_of_week: number[];
}

export interface Assignment {
  id: number;
  user: User;
  task: Task;
  shift: Shift | null;
  zone: Zone | null;
  date: string;
  status: AssignmentStatus;
  assigned_by: User | null;
}

export interface TaskSubmission {
  id: number;
  assignment_id: number;
  photo_url: string;
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
