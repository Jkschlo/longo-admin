"use strict";
/**
 * Shared security utilities
 * Common security functions used across mobile and web apps
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCK_DURATION = exports.MAX_LOGIN_ATTEMPTS = exports.SESSION_CHECK_INTERVAL = exports.SESSION_TIMEOUT = void 0;
exports.sanitizeEmail = sanitizeEmail;
exports.sanitizeString = sanitizeString;
exports.isValidEmail = isValidEmail;
exports.validatePasswordStrength = validatePasswordStrength;
exports.isSessionExpired = isSessionExpired;
exports.getMinutesUntilExpiry = getMinutesUntilExpiry;
/**
 * Session timeout constants (in milliseconds)
 */
exports.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
exports.SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
/**
 * Rate limiting constants
 */
exports.MAX_LOGIN_ATTEMPTS = 5;
exports.LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
/**
 * Input sanitization utilities
 */
function sanitizeEmail(email) {
    if (!email)
        return "";
    return email.trim().toLowerCase();
}
function sanitizeString(str, maxLength = 255) {
    if (!str)
        return "";
    return str.trim().substring(0, maxLength);
}
/**
 * Validate email format
 */
function isValidEmail(email) {
    if (!email)
        return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}
/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
    const errors = [];
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
function isSessionExpired(lastActivity) {
    const timeSinceActivity = Date.now() - lastActivity;
    return timeSinceActivity > exports.SESSION_TIMEOUT;
}
/**
 * Calculate minutes until session expires
 */
function getMinutesUntilExpiry(lastActivity) {
    const timeSinceActivity = Date.now() - lastActivity;
    const timeRemaining = exports.SESSION_TIMEOUT - timeSinceActivity;
    return Math.max(0, Math.ceil(timeRemaining / 60000));
}
