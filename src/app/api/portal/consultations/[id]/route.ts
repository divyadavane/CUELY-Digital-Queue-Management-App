import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalConsultationDetail } from "@/lib/portal/consultations";
import { createServiceClient } from "@/lib/supabaseService";

export const maxDuration = 10;

// GET /api/portal/consultations/[id]
// Full detail for a patient's consultation (notes + prescription read-only).
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

  return NextResponse.json({ consultation: detail });
}

// PATCH /api/portal/consultations/[id]
// Lets the patient advance their own consultation lifecycle (ready/in_call).
// Ownership is enforced inside the set_consultation_status RPC via p_patient_phone.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status as string | undefined;

  const allowed: string[] = ["ready", "in_call"];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("set_consultation_status", {
    p_consultation_id: id,
    p_status: status,
    p_patient_phone: session.phone,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
