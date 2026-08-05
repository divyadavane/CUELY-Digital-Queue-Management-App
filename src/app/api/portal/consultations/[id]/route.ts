import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalConsultationDetail } from "@/lib/portal/consultations";

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
