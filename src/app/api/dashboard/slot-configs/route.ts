import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";
import { getSlotConfigs, upsertSlotConfig, Actor } from "@/lib/schedule";

export const maxDuration = 15;

// GET /api/dashboard/slot-configs?queueId=...
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const configs = await getSlotConfigs(queueId);
  return NextResponse.json({ configs });
}

// POST /api/dashboard/slot-configs — upsert a slot config
// body: { queueId, appointmentType, durationMins, bufferMins?, overbooking? }
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
    .select("business_id")
    .eq("id", queueId)
    .maybeSingle();
  if (!queue) return NextResponse.json({ error: "Queue not found" }, { status: 404 });

  const appointmentType = String(body?.appointmentType || "routine");
  const durationMins = Math.max(5, parseInt(body?.durationMins, 10) || 15);
  const bufferMins = Math.max(0, parseInt(body?.bufferMins, 10) || 0);
  const overbooking = Math.max(1, parseInt(body?.overbooking, 10) || 1);

  const actor: Actor = { id: admin.adminId, name: admin.role };
  const config = await upsertSlotConfig(
    {
      businessId: queue.business_id,
      queueId,
      appointmentType: appointmentType as any,
      durationMins,
      bufferMins,
      overbooking,
    },
    actor
  );
  if (!config) return NextResponse.json({ error: "Failed to save slot config" }, { status: 400 });
  return NextResponse.json({ config });
}
