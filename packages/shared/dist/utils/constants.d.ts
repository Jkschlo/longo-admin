/**
 * Shared constants used across Longo projects
 */
/**
 * Storage bucket names (must match Supabase storage configuration)
 */
export declare const STORAGE_BUCKETS: {
    readonly MODULE_IMAGES: "module-images";
    readonly CATEGORY_IMAGES: "category-images";
    readonly MODULE_CONTENT: "module-content";
    readonly AVATARS: "avatars";
};
/**
 * User roles and permissions
 */
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly USER: "user";
};
/**
 * Module progress statuses
 */
export declare const PROGRESS_STATUS: {
    readonly NOT_STARTED: "not_started";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETE: "complete";
};
/**
 * Content types for module content
 */
export declare const CONTENT_TYPES: {
    readonly TEXT: "text";
    readonly IMAGE: "image";
    readonly VIDEO: "video";
    readonly PDF: "pdf";
    readonly SECTION: "section";
};
/**
 * Quiz scoring
 */
export declare const QUIZ_CONFIG: {
    readonly PASSING_SCORE: 80;
    readonly MIN_QUESTIONS: 1;
    readonly MAX_QUESTIONS: 100;
};
/**
 * API endpoints (if using a shared API)
 */
export declare const API_ENDPOINTS: {
    readonly UPLOAD_IMAGE: "/api/upload-image";
    readonly DELETE_USER: "/api/delete-user";
    readonly DELETE_OWN_ACCOUNT: "/api/delete-own-account";
};
