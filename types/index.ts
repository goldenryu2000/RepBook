// DB types
export interface Workout {
  id: string;
  date: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
}

export interface Set {
  id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  unit: string;
  set_number: number;
}

export interface Template {
  id: string;
  name: string;
  assigned_days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  assigned_dates?: string[]; // YYYY-MM-DD
  created_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  name: string;
  target_sets: number;
  order_index: number;
}

export interface UserProfile {
  name: string;
  goal: string;
  defaultUnit: 'lbs' | 'kgs';
}

// Active session types (in-memory, Zustand)
export interface ActiveSet {
  id: string;
  reps: string;
  weight: string;
  unit: string;
}

export interface ActiveExercise {
  id: string;
  name: string;
  sets: ActiveSet[];
}
