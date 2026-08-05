import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalConsultations } from "@/lib/portal/consultations";
import { createServiceClient } from "@/lib/supabaseService";
import { sendVideoBookingNotification } from "@/lib/video/notify";

export const maxDuration = 10;

// GET /api/portal/consultations
// List the patient's video consultations (upcoming + history).
export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const consultations = await getPortalConsultations(session.phone);
  return NextResponse.json({ consultations });
}

// POST /api/portal/consultations
// body: { queueId, date, time }
// Books a video consultation: appointment + meeting room + pending bill.
export async function POST(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const queueId = String(body?.queueId || "");
    const date = String(body?.date || "");
    const time = body?.time ? String(body.time) : null;

    if (!queueId || !date) {
      return NextResponse.json({ error: "Queue and date are required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("book_video_consultation", {
      p_queue_id: queueId,
      p_phone: session.phone,
      p_patient_id: session.profile.id,
      p_name: session.profile.name || undefined,
      p_date: date,
      p_time: time || undefined,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = data as Record<string, any>;
    if (result?.success) {
      const origin = new URL(req.url).origin;
      await sendVideoBookingNotification({
        queueId,
        phone: session.phone,
        consultationId: result.consultation_id,
        patientName: session.profile.name || "Patient",
        joinUrl: `${origin}/video/${result.consultation_id}`,
        scheduledStart: result.scheduled_start,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
