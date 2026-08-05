import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { getAdminConsultations } from "@/lib/admin/consultations";

export const maxDuration = 10;

// GET /api/dashboard/consultations?queueId=...
// Today's + recent video consultations for the doctor's queue.
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) {
    return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  }

  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const consultations = await getAdminConsultations(queueId);
  return NextResponse.json({ consultations });
}
