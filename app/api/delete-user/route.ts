import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, verifyAdminAuth } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

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
        { error: "Server configuration error: Missing service role key. Add SUPABASE_SERVICE_ROLE_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Create admin client with service role key (server-side only)
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

    const body = await request.json();
    const { userId } = body;

    // Input validation
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Get the authenticated admin to prevent self-deletion
    const authResult = await verifyAdminAuth(request);
    if (authResult && authResult.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Delete user_roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    // 2. Delete module_progress
    await supabaseAdmin.from("module_progress").delete().eq("user_id", userId);

    // 3. Delete quiz_attempts
    await supabaseAdmin.from("quiz_attempts").delete().eq("user_id", userId);

    // 4. Delete profile
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // 5. Delete from auth.users (requires admin/service role)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error("Auth delete error:", authError);
      return NextResponse.json(
        { error: `Failed to delete auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

