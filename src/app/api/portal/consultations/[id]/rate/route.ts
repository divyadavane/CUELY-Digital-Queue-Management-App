import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabaseService";

export const maxDuration = 10;

// POST /api/portal/consultations/[id]/rate
// body: { rating: 1-5, comment?: string }
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const rating = Number(body?.rating);
    const comment = body?.comment ? String(body.comment) : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("submit_consultation_rating", {
      p_consultation_id: id,
      p_rating_value: rating,
      p_comment: comment || undefined,
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
