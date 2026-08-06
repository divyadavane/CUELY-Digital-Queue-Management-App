import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";
import { updateSchedule, deleteSchedule, Actor } from "@/lib/schedule";

export const maxDuration = 15;

// PUT /api/dashboard/schedules/[id] — update schedule (replaces shifts)
// body: { queueId, title?, effectiveFrom, effectiveTo?, timezone?, shifts: [...] }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await ctx.params;

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
  const schedule = await updateSchedule(id, {
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
  if (!schedule) return NextResponse.json({ error: "Failed to update schedule" }, { status: 400 });
  return NextResponse.json({ schedule });
}

// DELETE /api/dashboard/schedules/[id]?queueId=...
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const actor: Actor = { id: admin.adminId, name: admin.role };
  const ok = await deleteSchedule(id, actor);
  if (!ok) return NextResponse.json({ error: "Failed to delete schedule" }, { status: 400 });
  return NextResponse.json({ success: true });
}
