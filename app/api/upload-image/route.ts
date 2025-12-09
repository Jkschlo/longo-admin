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
    const originalName =
      typeof file.name === "string" && file.name.length > 0
        ? file.name
        : "file";

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

    // Determine bucket based on folder
    // Use "training-media" bucket for all uploads (quiz-questions, module-content, etc.)
    const bucketName = "training-media";

    // Upload using service role
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      console.error("Bucket:", bucketName);
      console.error("File path:", filePath);
      console.error("Error details:", JSON.stringify(uploadError, null, 2));
      
      // Provide more helpful error messages
      let errorMessage = uploadError.message;
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
        errorMessage = `Storage bucket "${bucketName}" not found. Please create it in Supabase Storage.`;
      } else if (uploadError.message?.includes("policy") || uploadError.message?.includes("permission")) {
        errorMessage = `Permission denied. Please check bucket policies in Supabase Storage.`;
      }
      
      return NextResponse.json(
        { error: errorMessage, details: uploadError.message },
        { status: 500 }
      );
    }

    // Return public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json(
      { url: publicUrlData.publicUrl },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Unexpected upload-image error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
