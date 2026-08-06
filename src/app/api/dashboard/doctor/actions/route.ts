import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";

export const maxDuration = 15;

// POST /api/dashboard/doctor/actions
// body:
//   action: "start_consult" | "complete_consult" | "request_assistance" | "clear_assistance"
//   ticketId?: string   (for consult actions)
//   queueId?: string    (for assistance actions)
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");

  const svc = createServiceClient();

  if (action === "start_consult" || action === "complete_consult") {
    const ticketId = String(body?.ticketId || "");
    if (!ticketId) return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    if (!(await isAdminOfQueue(String(body?.queueId || "")))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const rpcName = action === "start_consult" ? "start_consult" : "complete_consult";
    const { data, error } = await svc.rpc(rpcName, { p_ticket_id: ticketId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "request_assistance" || action === "clear_assistance") {
    const queueId = String(body?.queueId || "");
    if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
    if (!(await isAdminOfQueue(queueId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const rpcName = action === "request_assistance" ? "request_assistance" : "clear_assistance";
    const { data, error } = await svc.rpc(rpcName, { p_queue_id: queueId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
