import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getVideoDoctors } from "@/lib/portal/consultations";

export const maxDuration = 10;

// GET /api/portal/consultations/doctors
// Active doctors that currently offer video consultations.
export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const doctors = await getVideoDoctors();
  return NextResponse.json({ doctors });
}
