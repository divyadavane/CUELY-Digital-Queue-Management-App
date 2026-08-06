import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalAppointments } from "@/lib/portal/data";
import { createServiceClient } from "@/lib/supabaseService";
import { isSlotAvailable } from "@/lib/schedule";

export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const appointments = await getPortalAppointments(session.phone);
  return NextResponse.json({ appointments });
}

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
    const emergencyType = body?.emergencyType ? String(body.emergencyType) : null;

    if (!queueId || !date) {
      return NextResponse.json({ error: "Queue and date are required" }, { status: 400 });
    }

    if (time) {
      const available = await isSlotAvailable(queueId, date, time, (emergencyType || "routine") as any);
      if (!available) {
        return NextResponse.json(
          { error: "That time slot is no longer available. Please pick another time." },
          { status: 409 }
        );
      }
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("book_appointment", {
      p_queue_id: queueId,
      p_name: session.profile.name || undefined,
      p_phone: session.phone,
      p_emergency_type: emergencyType || undefined,
      p_date: date,
      p_time: time || undefined,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
