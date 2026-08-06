import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalConsultations } from "@/lib/portal/consultations";
import { getConsultationConversations, ChatConversation } from "@/lib/consultationChat";

export const maxDuration = 15;

// GET /api/portal/messages — the patient's conversation list
export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const consultations = await getPortalConsultations(session.phone);
  const ids = consultations.map((c) => c.id);
  const convs = await getConsultationConversations(ids, "patient");

  const byConsultation = new Map(consultations.map((c) => [c.id, c]));
  const list: ChatConversation[] = ids
    .map((id) => {
      const c = byConsultation.get(id);
      const conv = convs[id];
      return {
        ...conv,
        doctor_name: conv?.doctor_name ?? c?.doctor?.doctor_name ?? c?.doctor?.name ?? null,
        doctor_department: conv?.doctor_department ?? c?.doctor?.department ?? null,
        patient_name: conv?.patient_name ?? c?.patient_name ?? null,
        patient_phone: conv?.patient_phone ?? c?.patient_phone ?? null,
      } as ChatConversation;
    })
    .sort((a, b) => {
      if (!a.last_message_at) return b.last_message_at ? 1 : 0;
      if (!b.last_message_at) return -1;
      return b.last_message_at.localeCompare(a.last_message_at);
    });

  return NextResponse.json({ conversations: list });
}
