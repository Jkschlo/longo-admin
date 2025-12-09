"use strict";
/**
 * Shared constants used across Longo projects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = exports.QUIZ_CONFIG = exports.CONTENT_TYPES = exports.PROGRESS_STATUS = exports.USER_ROLES = exports.STORAGE_BUCKETS = void 0;
/**
 * Storage bucket names (must match Supabase storage configuration)
 */
exports.STORAGE_BUCKETS = {
    MODULE_IMAGES: "module-images",
    CATEGORY_IMAGES: "category-images",
    MODULE_CONTENT: "module-content",
    AVATARS: "avatars",
};
/**
 * User roles and permissions
 */
exports.USER_ROLES = {
    ADMIN: "admin",
    USER: "user",
};
/**
 * Module progress statuses
 */
exports.PROGRESS_STATUS = {
    NOT_STARTED: "not_started",
    IN_PROGRESS: "in_progress",
    COMPLETE: "complete",
};
/**
 * Content types for module content
 */
exports.CONTENT_TYPES = {
    TEXT: "text",
    IMAGE: "image",
    VIDEO: "video",
    PDF: "pdf",
    SECTION: "section",
};
/**
 * Quiz scoring
 */
exports.QUIZ_CONFIG = {
    PASSING_SCORE: 80, // Percentage required to pass
    MIN_QUESTIONS: 1,
    MAX_QUESTIONS: 100,
};
/**
 * API endpoints (if using a shared API)
 */
exports.API_ENDPOINTS = {
    UPLOAD_IMAGE: "/api/upload-image",
    DELETE_USER: "/api/delete-user",
    DELETE_OWN_ACCOUNT: "/api/delete-own-account",
};
