/**
 * Shared security utilities
 * Common security functions used across mobile and web apps
 */
/**
 * Session timeout constants (in milliseconds)
 */
export declare const SESSION_TIMEOUT: number;
export declare const SESSION_CHECK_INTERVAL: number;
/**
 * Rate limiting constants
 */
export declare const MAX_LOGIN_ATTEMPTS = 5;
export declare const LOCK_DURATION: number;
/**
 * Input sanitization utilities
 */
export declare function sanitizeEmail(email: string): string;
export declare function sanitizeString(str: string, maxLength?: number): string;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate password strength
 */
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Check if session has expired based on last activity timestamp
 */
export declare function isSessionExpired(lastActivity: number): boolean;
/**
 * Calculate minutes until session expires
 */
export declare function getMinutesUntilExpiry(lastActivity: number): number;
