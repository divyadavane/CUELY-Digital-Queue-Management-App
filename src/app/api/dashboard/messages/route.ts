import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { getAdminConsultations } from "@/lib/admin/consultations";
import { getConsultationConversations, ChatConversation } from "@/lib/consultationChat";

export const maxDuration = 15;

// GET /api/dashboard/messages?queueId=... — a doctor's conversation list
export async function GET(req: NextRequest) {
  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) {
    return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: queue } = await supabase
    .from("queues")
    .select("id, business_id, name, doctor_name")
    .eq("id", queueId)
    .maybeSingle();
  if (!queue) {
    return NextResponse.json({ error: "Queue not found" }, { status: 404 });
  }

  const isAdmin = await supabase.rpc("is_admin_of_business", {
    p_business_id: queue.business_id,
  });
  if (isAdmin.error || !isAdmin.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const consultations = await getAdminConsultations(queueId);
  const ids = consultations.map((c) => c.id);
  const convs = await getConsultationConversations(ids, "doctor");
  const doctorName = queue.doctor_name || queue.name || "Doctor";

  const byId = new Map(consultations.map((c) => [c.id, c]));
  const list: ChatConversation[] = ids
    .map((id) => {
      const c = byId.get(id);
      const conv = convs[id];
      return {
        ...conv,
        doctor_name: conv?.doctor_name ?? doctorName,
        doctor_department: conv?.doctor_department ?? c?.queue_name ?? null,
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