import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";
import {
  getLeaveBlocks,
  createLeaveBlock,
  Actor,
  CreateLeaveBlockResult,
} from "@/lib/schedule";

export const maxDuration = 15;

// GET /api/dashboard/leave-blocks?queueId=... — list blocks for a queue
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const blocks = await getLeaveBlocks({ queueId });
  return NextResponse.json({ blocks });
}

// POST /api/dashboard/leave-blocks
// body: {
//   queueId? (null => business-wide), queueIds?: string[], title, blockType,
//   startDate, endDate, startTime?, endTime?, recurrence?, recurringDays?,
//   notes?, confirmConflicts?, notifyPatients?
// }
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const queueId = body?.queueId ? String(body.queueId) : null;

  // authorization: every target queue must be owned by the admin's business
  const supabase = createServiceClient();
  if (queueId) {
    if (!(await isAdminOfQueue(queueId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (Array.isArray(body?.queueIds) && body.queueIds.length > 0) {
    for (const qid of body.queueIds) {
      if (!(await isAdminOfQueue(qid))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  } else {
    // business-wide: resolve business from the admin
    const { data: ad } = await supabase
      .from("admins")
      .select("business_id")
      .eq("id", admin.adminId)
      .maybeSingle();
    if (!ad) return NextResponse.json({ error: "Admin business not found" }, { status: 403 });
    return createWithBusiness(ad.business_id, body, admin);
  }

  const sampleQid = queueId || (Array.isArray(body?.queueIds) ? body.queueIds[0] : null);
  if (!sampleQid) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  const { data: queue } = await supabase
    .from("queues")
    .select("business_id, doctor_name, name")
    .eq("id", sampleQid)
    .maybeSingle();
  if (!queue) return NextResponse.json({ error: "Queue not found" }, { status: 404 });

  return createWithBusiness(queue.business_id, body, admin);
}

async function createWithBusiness(businessId: string, body: any, admin: { adminId: string; role: string }) {
  const actor: Actor = { id: admin.adminId, name: admin.role };
  const result: CreateLeaveBlockResult = await createLeaveBlock({
    businessId,
    title: String(body?.title || "Leave"),
    blockType: body?.blockType === "partial" ? "partial" : "full_day",
    startDate: String(body?.startDate || ""),
    endDate: String(body?.endDate || body?.startDate || ""),
    startTime: body?.startTime ? String(body.startTime) : null,
    endTime: body?.endTime ? String(body.endTime) : null,
    recurrence: String(body?.recurrence || "none"),
    recurringDays: Array.isArray(body?.recurringDays) ? body.recurringDays.map(Number) : [],
    queueId: body?.queueId ? String(body.queueId) : null,
    queueIds: Array.isArray(body?.queueIds) ? body.queueIds.map(String) : undefined,
    doctorName: body?.doctorName ? String(body.doctorName) : null,
    notes: body?.notes ? String(body.notes) : null,
    confirmConflicts: body?.confirmConflicts === true,
    actor,
  });

  if (result.conflicts.length > 0 && !result.confirmed) {
    return NextResponse.json(
      { error: "Conflicting appointments found", conflicts: result.conflicts },
      { status: 409 }
    );
  }
  return NextResponse.json(result, { status: result.confirmed ? 201 : 200 });
}
