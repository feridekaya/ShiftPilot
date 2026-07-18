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
  occurrence: number;
  times_per_day: number;
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

export type FeedbackCategory = 'temizlik' | 'yemekler' | 'iecekler' | 'duzen' | 'ses' | 'personel' | 'genel' | 'diger';
export type FeedbackResponse = 'positive' | 'negative';

export interface Feedback {
  id: number;
  category: FeedbackCategory;
  category_display: string;
  content: string;
  is_anonymous: boolean;
  customer_rating: number | null;
  photo_url: string;
  created_at: string;
  user_name: string;
  user_role: Role;
  response: FeedbackResponse | null;
  response_note: string;
  responded_by_name: string | null;
  responded_at: string | null;
}

export type AnnouncementPriority = 'normal' | 'medium' | 'critical';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  target_roles: Role[];
  created_by: number;
  created_by_name: string;
  created_by_role: Role;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  read_count: number;
  total_users: number;
  is_read_by_me: boolean;
  readers: { id: number; name: string; role: string }[];
}

export interface DailyEmployee {
  id: number;
  name: string;
  role: Role;
  gender: Gender | null;
  evaluated: boolean;
  evaluation_id?: number;
  evaluator_name?: string;
  avg_score?: number;
}

export interface EmployeeEvaluation {
  id: number;
  evaluatee: number;
  evaluatee_name: string;
  evaluator: number | null;
  evaluator_name: string;
  date: string;
  punctuality: number;
  break_compliance: number;
  customer_comm: number;
  speed_agility: number;
  teamwork: number;
  hygiene_uniform: number;
  problem_solving: number;
  feedback_openness: number;
  energy_motivation: number;
  note: string;
  created_at: string;
}

export interface Training {
  id: number;
  title: string;
  description: string;
  pdf_url: string;
  visible_to: Role[];
  uploaded_by: number | null;
  uploaded_by_name: string;
  created_at: string;
  is_active: boolean;
}
