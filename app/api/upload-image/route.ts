import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdminAuth } from "@/lib/auth-utils";

// Create admin client with service role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_PDF_TYPE = "application/pdf";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FOLDERS = ["modules", "categories", "module-content"];

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    // Check for required env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase URL" },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: Missing service role key" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;

    if (!file || !folder) {
      return NextResponse.json(
        { error: "File and folder are required" },
        { status: 400 }
      );
    }

    // Validate folder name
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { error: "Invalid folder name" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type || "";
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
    const isPDF = fileType === ALLOWED_PDF_TYPE;
    
    if (!isImage && !isPDF) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed." },
        { status: 400 }
      );
    }

    // Additional validation: check file extension matches content type
    const fileName = (file as any).name || "";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
    
    if (isPDF && fileExtension !== "pdf") {
      return NextResponse.json(
        { error: "File extension does not match content type" },
        { status: 400 }
      );
    }
    
    if (isImage && !["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
      return NextResponse.json(
        { error: "File extension does not match content type" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename - preserve extension if it exists
    const originalName = (file as any).name || "file";
    const ext = originalName.includes(".") ? originalName.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
    const fileName = `${randomUUID()}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    // Determine content type - support images and PDFs
    let contentType = file.type;
    if (!contentType) {
      if (ext === "pdf") {
        contentType = "application/pdf";
      } else {
        contentType = `image/${ext === "jpg" || ext === "jpeg" ? "jpeg" : ext}`;
      }
    }

    // Upload using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from("training-media")
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("training-media")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

