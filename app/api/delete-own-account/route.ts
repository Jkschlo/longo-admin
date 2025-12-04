import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check for required env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase URL" },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server configuration error: Missing service role key" },
        { status: 500 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create a client to verify the token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get the request body
    const body = await request.json();
    const { confirmName } = body;

    // Input validation
    if (!confirmName || typeof confirmName !== "string") {
      return NextResponse.json(
        { error: "Confirmation name is required" },
        { status: 400 }
      );
    }

    // Get user's profile to verify name
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    
    // Verify name matches
    if (confirmName.trim().toLowerCase() !== fullName.toLowerCase()) {
      return NextResponse.json(
        { error: "Name does not match. Please type your exact full name." },
        { status: 400 }
      );
    }

    // Create admin client with service role key for deletion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Delete user_roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    // 2. Delete module_progress
    await supabaseAdmin.from("module_progress").delete().eq("user_id", userId);

    // 3. Delete quiz_attempts
    await supabaseAdmin.from("quiz_attempts").delete().eq("user_id", userId);

    // 4. Delete profile
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // 5. Delete from auth.users (requires admin/service role)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (authDeleteError) {
      console.error("Auth delete error:", authDeleteError);
      return NextResponse.json(
        { error: `Failed to delete account: ${authDeleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
