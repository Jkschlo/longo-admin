/**
 * Shared security utilities
 * Common security functions used across mobile and web apps
 */

/**
 * Session timeout constants (in milliseconds)
 */
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Rate limiting constants
 */
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Input sanitization utilities
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

export function sanitizeString(str: string, maxLength: number = 255): string {
  if (!str) return "";
  return str.trim().substring(0, maxLength);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if session has expired based on last activity timestamp
 */
export function isSessionExpired(lastActivity: number): boolean {
  const timeSinceActivity = Date.now() - lastActivity;
  return timeSinceActivity > SESSION_TIMEOUT;
}

/**
 * Calculate minutes until session expires
 */
export function getMinutesUntilExpiry(lastActivity: number): number {
  const timeSinceActivity = Date.now() - lastActivity;
  const timeRemaining = SESSION_TIMEOUT - timeSinceActivity;
  return Math.max(0, Math.ceil(timeRemaining / 60000));
}

