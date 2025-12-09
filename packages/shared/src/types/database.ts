/**
 * Shared database types and interfaces for Longo projects
 * These types represent the Supabase database schema
 */

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
  last_online_at?: string | null;
}

export interface Category {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  is_active: boolean;
  role_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  cover_image: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ModuleContent {
  id: string;
  module_id: string;
  content_type: "text" | "image" | "video" | "pdf" | "section";
  content: string;
  caption: string | null;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestion {
  id: string;
  module_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  module_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, number>;
  time_spent: number | null;
  created_at?: string;
}

export interface ModuleProgress {
  id?: string;
  user_id: string;
  module_id: string;
  status: "not_started" | "in_progress" | "complete";
  progress_percentage: number;
  last_accessed_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  created_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  criteria: Record<string, unknown>;
  created_at?: string;
}

export interface UserBadge {
  id?: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  created_at?: string;
}

// Helper type for content blocks (used in admin UI)
export interface ContentBlock {
  id?: string;
  type: "section" | "text" | "image" | "video" | "pdf";
  content: string;
  caption?: string | null;
  order_index: number;
}

