import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Delete from module_progress
    const { error: mpError } = await supabase
      .from("module_progress")
      .delete()
      .eq("user_id", userId);

    if (mpError) {
      console.error("Error deleting module_progress:", mpError);
    }

    // 2. Delete from quiz_attempts
    const { error: qaError } = await supabase
      .from("quiz_attempts")
      .delete()
      .eq("user_id", userId);

    if (qaError) {
      console.error("Error deleting quiz_attempts:", qaError);
    }

    // 3. Delete from user_roles
    const { error: urError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (urError) {
      console.error("Error deleting user_roles:", urError);
    }

    // 4. Delete profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
    }

    // 5. DELETE USER from auth.users (SERVICE ROLE REQUIRED)
    // Type assertion needed for Turbopack build compatibility
    const adminAuth = supabaseAdmin.auth.admin;
    const { error: deleteErr } = await (adminAuth as any).deleteUser(userId);

    if (deleteErr) {
      console.error("Error deleting user from auth.users:", deleteErr);
      return NextResponse.json(
        { error: deleteErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "User fully deleted" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected error in delete-user route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
