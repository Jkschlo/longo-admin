import { supabase } from "./supabaseClient";

/**
 * Makes an authenticated API request with the current user's session token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error("No active session. Please log in again.");
  }

  // Add authorization header
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  
  // Merge with existing headers
  const mergedOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, mergedOptions);
}
