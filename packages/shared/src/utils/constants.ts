/**
 * Shared constants used across Longo projects
 */

/**
 * Storage bucket names (must match Supabase storage configuration)
 */
export const STORAGE_BUCKETS = {
  MODULE_IMAGES: "module-images",
  CATEGORY_IMAGES: "category-images",
  MODULE_CONTENT: "module-content",
  AVATARS: "avatars",
} as const;

/**
 * User roles and permissions
 */
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

/**
 * Module progress statuses
 */
export const PROGRESS_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETE: "complete",
} as const;

/**
 * Content types for module content
 */
export const CONTENT_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  PDF: "pdf",
  SECTION: "section",
} as const;

/**
 * Quiz scoring
 */
export const QUIZ_CONFIG = {
  PASSING_SCORE: 80, // Percentage required to pass
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 100,
} as const;

/**
 * API endpoints (if using a shared API)
 */
export const API_ENDPOINTS = {
  UPLOAD_IMAGE: "/api/upload-image",
  DELETE_USER: "/api/delete-user",
  DELETE_OWN_ACCOUNT: "/api/delete-own-account",
} as const;

