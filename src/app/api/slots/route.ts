import { NextRequest, NextResponse } from "next/server";
import { computeAvailableSlots } from "@/lib/schedule";

export const maxDuration = 15;

// GET /api/slots?queueId=...&date=YYYY-MM-DD&appointmentType=routine
// Public availability endpoint used by the customer booking form and any
// third-party booking widget. Queue ids are already public in the app.
export async function GET(req: NextRequest) {
  const queueId = req.nextUrl.searchParams.get("queueId");
  const date = req.nextUrl.searchParams.get("date");
  if (!queueId || !date) {
    return NextResponse.json({ error: "queueId and date are required" }, { status: 400 });
  }
  const appointmentType = (req.nextUrl.searchParams.get("appointmentType") || "routine") as any;
  const slots = await computeAvailableSlots(queueId, date, appointmentType);
  return NextResponse.json({ slots });
}
