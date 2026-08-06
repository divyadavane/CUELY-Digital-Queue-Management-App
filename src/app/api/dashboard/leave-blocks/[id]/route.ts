import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";
import { updateLeaveBlock, cancelLeaveBlock, Actor } from "@/lib/schedule";

export const maxDuration = 15;

// PATCH /api/dashboard/leave-blocks/[id]?queueId=...
// body: { title?, blockType?, startDate?, endDate?, startTime?, endTime?, notes? }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await ctx.params;

  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: queue } = await supabase
    .from("queues")
    .select("business_id")
    .eq("id", queueId)
    .maybeSingle();
  if (!queue) return NextResponse.json({ error: "Queue not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const actor: Actor = { id: admin.adminId, name: admin.role };
  const block = await updateLeaveBlock(
    id,
    {
      businessId: queue.business_id,
      title: body?.title,
      blockType: body?.blockType === "partial" ? "partial" : body?.blockType === "full_day" ? "full_day" : undefined,
      startDate: body?.startDate ? String(body.startDate) : undefined,
      endDate: body?.endDate ? String(body.endDate) : undefined,
      startTime: body?.startTime ? String(body.startTime) : undefined,
      endTime: body?.endTime ? String(body.endTime) : undefined,
      recurrence: body?.recurrence ? String(body.recurrence) : undefined,
      recurringDays: Array.isArray(body?.recurringDays) ? body.recurringDays.map(Number) : undefined,
      notes: body?.notes ? String(body.notes) : undefined,
    },
    actor
  );
  if (!block) return NextResponse.json({ error: "Failed to update block" }, { status: 400 });
  return NextResponse.json({ block });
}

// DELETE /api/dashboard/leave-blocks/[id]?queueId=... — cancels the block
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await ctx.params;

  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: block } = await supabase
    .from("leave_blocks")
    .select("business_id")
    .eq("id", id)
    .maybeSingle();
  if (!block) return NextResponse.json({ error: "Block not found" }, { status: 404 });

  const actor: Actor = { id: admin.adminId, name: admin.role };
  const ok = await cancelLeaveBlock(id, block.business_id, actor);
  if (!ok) return NextResponse.json({ error: "Failed to cancel block" }, { status: 400 });
  return NextResponse.json({ success: true });
}
