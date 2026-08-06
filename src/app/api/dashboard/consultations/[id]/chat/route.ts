import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfConsultation } from "@/lib/admin/guard";
import { getDoctorConsultationDetail } from "@/lib/admin/consultations";
import {
  listConsultationMessages,
  insertConsultationMessage,
  markConsultationChatRead,
  broadcastChatUnread,
} from "@/lib/consultationChat";

export const maxDuration = 15;

// GET /api/dashboard/consultations/[id]/chat — message history
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await isAdminOfConsultation(id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const messages = await listConsultationMessages(id);
  await markConsultationChatRead(id, "doctor");
  return NextResponse.json({ messages });
}

// POST /api/dashboard/consultations/[id]/chat
// body: { message?: string, attachmentPath?: string | null }
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

  const body = await req.json().catch(() => ({}));
  const detail = await getDoctorConsultationDetail(id);
  const senderName = detail?.doctor_name || "Doctor";

  const message = await insertConsultationMessage(
    id,
    "doctor",
    senderName,
    { message: body?.message, attachmentPath: body?.attachmentPath }
  );
  if (!message) {
    return NextResponse.json({ error: "Message is empty" }, { status: 400 });
  }
  broadcastChatUnread();
  return NextResponse.json({ message });
}
