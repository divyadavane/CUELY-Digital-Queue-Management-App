import { createClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { queueId, ratingValue, ticketId, patientName, comment } = await req.json();

    if (!queueId || typeof ratingValue !== "number" || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ error: "queueId and a ratingValue between 1 and 5 are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_rating", {
      p_queue_id: queueId,
      p_rating_value: ratingValue,
      p_ticket_id: ticketId ?? null,
      p_patient_name: patientName ?? null,
      p_comment: comment ?? null,
    });

    if (error) {
      if (String(error.message).toLowerCase().includes("already rated")) {
        return NextResponse.json({ error: "already_rated", message: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
