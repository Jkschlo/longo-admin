import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, verifyAdminAuth } from "@/lib/auth-utils";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

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
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error("Auth delete error:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete auth user: ${deleteError.message}` },
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

