import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalConsultationDetail } from "@/lib/portal/consultations";
import {
  listConsultationMessages,
  insertConsultationMessage,
  markConsultationChatRead,
  broadcastChatUnread,
} from "@/lib/consultationChat";

export const maxDuration = 15;

// GET /api/portal/consultations/[id]/chat — message history
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const detail = await getPortalConsultationDetail(id, session.phone);
  if (!detail) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
  }
  const messages = await listConsultationMessages(id);
  await markConsultationChatRead(id, "patient");
  return NextResponse.json({ messages });
}

// POST /api/portal/consultations/[id]/chat
// body: { message?: string, attachmentPath?: string | null }
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const detail = await getPortalConsultationDetail(id, session.phone);
  if (!detail) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const senderName = session.profile.name || session.phone;

  const message = await insertConsultationMessage(
    id,
    "patient",
    senderName,
    { message: body?.message, attachmentPath: body?.attachmentPath }
  );
  if (!message) {
    return NextResponse.json({ error: "Message is empty" }, { status: 400 });
  }
  broadcastChatUnread();
  return NextResponse.json({ message });
}
