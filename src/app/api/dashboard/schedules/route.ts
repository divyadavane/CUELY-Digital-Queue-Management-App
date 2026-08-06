import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";
import { getSchedulesForQueue, createSchedule, Actor } from "@/lib/schedule";

export const maxDuration = 15;

// GET /api/dashboard/schedules?queueId=... — all schedules + shifts for a queue
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const schedules = await getSchedulesForQueue(queueId);
  return NextResponse.json({ schedules });
}

// POST /api/dashboard/schedules
// body: { queueId, title?, effectiveFrom, effectiveTo?, timezone?, shifts: [...] }
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const queueId = String(body?.queueId || "");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: queue } = await supabase
    .from("queues")
    .select("business_id, doctor_name, name")
    .eq("id", queueId)
    .maybeSingle();
  if (!queue) return NextResponse.json({ error: "Queue not found" }, { status: 404 });

  const actor: Actor = { id: admin.adminId, name: admin.role };
  const schedule = await createSchedule({
    businessId: queue.business_id,
    queueId,
    doctorName: queue.doctor_name || queue.name,
    title: body?.title,
    effectiveFrom: String(body?.effectiveFrom || new Date().toISOString().slice(0, 10)),
    effectiveTo: body?.effectiveTo ? String(body.effectiveTo) : null,
    timezone: body?.timezone,
    shifts: Array.isArray(body?.shifts) ? body.shifts : [],
    actor,
  });
  if (!schedule) return NextResponse.json({ error: "Failed to create schedule" }, { status: 400 });
  return NextResponse.json({ schedule }, { status: 201 });
}
