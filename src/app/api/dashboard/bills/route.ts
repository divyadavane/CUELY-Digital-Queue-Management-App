import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// Read-only billing view for the doctor dashboard.
// Scoped to a single queue: only admins of the business that owns the queue
// may read these bills. No write access is exposed here — payment processing
// stays a Reception/Admin function.
export async function GET(req: NextRequest) {
  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) {
    return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: queue, error: queueError } = await supabase
    .from("queues")
    .select("id, business_id")
    .eq("id", queueId)
    .maybeSingle();

  if (queueError || !queue) {
    return NextResponse.json({ error: "Queue not found" }, { status: 404 });
  }

  const isAdmin = await supabase.rpc("is_admin_of_business", {
    p_business_id: queue.business_id,
  });
  if (isAdmin.error || !isAdmin.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id")
    .eq("queue_id", queueId);

  const ticketIds = (tickets || []).map((t) => t.id);

  const { data: bills, error: billsError } = await supabase
    .from("bills")
    .select("id, ticket_id, patient_phone, amount, status, description, created_at, tickets(token_number, status)")
    .in("ticket_id", ticketIds.length > 0 ? ticketIds : [""]);

  if (billsError) {
    return NextResponse.json({ error: billsError.message }, { status: 500 });
  }

  return NextResponse.json({ bills: bills || [] });
}

// PATCH /api/dashboard/bills
// body: { billId, status: "paid" | "pending" }
// Reception/Admin marks a bill as paid (or back to pending).
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { billId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const billId = String(body?.billId || "");
  const status = String(body?.status || "");
  if (!billId || (status !== "paid" && status !== "pending")) {
    return NextResponse.json({ error: "billId and status (paid|pending) are required" }, { status: 400 });
  }

  const { data: bill } = await supabase
    .from("bills")
    .select("id, business_id")
    .eq("id", billId)
    .maybeSingle();

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const isAdmin = await supabase.rpc("is_admin_of_business", {
    p_business_id: bill.business_id,
  });
  if (isAdmin.error || !isAdmin.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patch: Record<string, string> = { status };
  if (status === "paid") {
    patch.paid_at = new Date().toISOString();
  } else {
    patch.paid_at = "";
  }

  const { data, error } = await supabase
    .from("bills")
    .update(patch)
    .eq("id", billId)
    .select("id, ticket_id, patient_phone, amount, status, description, paid_at, created_at, tickets(token_number, status)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bill: data });
}
