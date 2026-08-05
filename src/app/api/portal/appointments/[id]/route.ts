import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabaseService";

export const maxDuration = 10;

// PATCH /api/portal/appointments/[id]
// body: { action: "cancel" } | { action: "reschedule", date, time? }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const supabase = createServiceClient();

  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("id, patient_phone, status")
      .eq("id", id)
      .single();

    if (!appt || appt.patient_phone !== session.phone) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "cancel") {
      const { data, error } = await supabase.rpc("cancel_appointment", {
        p_appointment_id: id,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
    }

    if (action === "reschedule") {
      const date = String(body?.date || "");
      const time = body?.time ? String(body.time) : null;
      if (!date) {
        return NextResponse.json({ error: "A new date is required" }, { status: 400 });
      }
      const { data, error } = await supabase.rpc("reschedule_appointment", {
        p_appointment_id: id,
        p_new_date: date,
        p_new_time: time || undefined,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
