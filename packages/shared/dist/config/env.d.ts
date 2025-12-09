/**
 * Shared environment configuration
 * Centralizes environment variable access and validation
 */
export interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
}
/**
 * Get Supabase configuration from environment variables
 * Supports both Next.js (NEXT_PUBLIC_*) and Expo (EXPO_PUBLIC_*) prefixes
 */
export declare function getSupabaseConfig(): SupabaseConfig;
/**
 * Validate that all required environment variables are set
 * Throws an error if any are missing
 */
export declare function validateEnv(): void;
