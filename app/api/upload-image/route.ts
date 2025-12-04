import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") as string;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!folder) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = (file as any).name || "file";

    // Determine extension
    const ext = originalName.includes(".")
      ? originalName.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";

    // 🔧 FIXED duplicate variable
    const finalFileName = `${uuidv4()}.${ext}`;
    const filePath = `${folder}/${finalFileName}`;

    // Determine content type
    const contentType =
      file.type ||
      (ext === "pdf" ? "application/pdf" : "image/jpeg");

    // Upload using service role
    const { error: uploadError } = await supabaseAdmin.storage
      .from("training-content")
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Return public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("training-content")
      .getPublicUrl(filePath);

    return NextResponse.json(
      { url: publicUrlData.publicUrl },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected upload-image error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
