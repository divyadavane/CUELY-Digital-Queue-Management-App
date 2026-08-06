import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { computeAvailableSlots } from "@/lib/schedule";

export const maxDuration = 15;

// GET /api/portal/slots?queueId=...&date=YYYY-MM-DD&appointmentType=routine
export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const queueId = req.nextUrl.searchParams.get("queueId");
  const date = req.nextUrl.searchParams.get("date");
  if (!queueId || !date) {
    return NextResponse.json({ error: "queueId and date are required" }, { status: 400 });
  }
  const appointmentType = (req.nextUrl.searchParams.get("appointmentType") || "routine") as any;
  const slots = await computeAvailableSlots(queueId, date, appointmentType);
  return NextResponse.json({ slots });
}
