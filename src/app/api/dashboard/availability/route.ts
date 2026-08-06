import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { getAvailabilityCalendar } from "@/lib/schedule";

export const maxDuration = 15;

// GET /api/dashboard/availability?queueId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const queueId = req.nextUrl.searchParams.get("queueId");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");
  if (!queueId || !startDate || !endDate) {
    return NextResponse.json({ error: "queueId, startDate and endDate are required" }, { status: 400 });
  }
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = await getAvailabilityCalendar(queueId, startDate, endDate);
  return NextResponse.json({ days });
}
