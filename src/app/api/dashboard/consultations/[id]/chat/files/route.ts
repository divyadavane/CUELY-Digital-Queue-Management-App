import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfConsultation } from "@/lib/admin/guard";
import { uploadChatAttachment, signAttachmentPath } from "@/lib/consultationChat";

export const maxDuration = 30;

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

// POST /api/dashboard/consultations/[id]/chat/files — multipart file upload
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await isAdminOfConsultation(id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 15 MB limit" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const path = await uploadChatAttachment(id, {
      name: file.name,
      contentType: file.type || "application/octet-stream",
      buffer,
    });
    if (!path) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const url = await signAttachmentPath(path);
    return NextResponse.json({ path, url, name: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
