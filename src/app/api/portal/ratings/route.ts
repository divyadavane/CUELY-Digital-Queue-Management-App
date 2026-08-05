import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalRatings } from "@/lib/portal/data";
import { createServiceClient } from "@/lib/supabaseService";

export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const ratings = await getPortalRatings(session.phone);
  return NextResponse.json({ ratings });
}

export async function POST(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const queueId = String(body?.queueId || "");
    const ticketId = body?.ticketId ? String(body.ticketId) : null;
    const ratingValue = Number(body?.ratingValue);
    const comment = body?.comment ? String(body.comment) : null;

    if (!queueId || !ratingValue || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ error: "A queue and a rating between 1 and 5 are required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("submit_rating", {
      p_queue_id: queueId,
      p_rating_value: ratingValue,
      p_ticket_id: ticketId,
      p_patient_name: session.profile.name,
      p_comment: comment,
      p_patient_phone: session.phone,
    });

    if (error) {
      if (String(error.message).toLowerCase().includes("already rated")) {
        return NextResponse.json({ error: "already_rated", message: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
