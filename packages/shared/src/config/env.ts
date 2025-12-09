/**
 * Shared environment configuration
 * Centralizes environment variable access and validation
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string; // Only available server-side
}

/**
 * Get Supabase configuration from environment variables
 * Supports both Next.js (NEXT_PUBLIC_*) and Expo (EXPO_PUBLIC_*) prefixes
 */
export function getSupabaseConfig(): SupabaseConfig {
  // Try Next.js env vars first, then Expo, then fallback
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;

  if (!url || !anonKey) {
    throw new Error(
      "Missing required Supabase environment variables. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(or EXPO_PUBLIC_* for Expo projects)"
    );
  }

  // Validate URL format
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error(`Invalid Supabase URL format: "${url}"`);
  }

  // Validate anon key format (JWT tokens are typically long)
  if (anonKey.length < 40) {
    throw new Error("Invalid Supabase anon key format");
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
}

/**
 * Validate that all required environment variables are set
 * Throws an error if any are missing
 */
export function validateEnv(): void {
  getSupabaseConfig();
}

