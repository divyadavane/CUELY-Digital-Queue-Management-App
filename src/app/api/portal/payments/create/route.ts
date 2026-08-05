import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabaseService";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";

export const maxDuration = 10;

// POST /api/portal/payments/create
// body: { billId }
// Creates a Razorpay order for a pending bill owned by the logged-in patient.
export async function POST(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payments are not enabled yet" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const billId = String(body?.billId || "");
    if (!billId) {
      return NextResponse.json({ error: "billId is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: bill } = await supabase
      .from("bills")
      .select("id, patient_phone, amount, status, description, created_at")
      .eq("id", billId)
      .eq("patient_phone", session.phone)
      .maybeSingle();

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    if (bill.status === "paid") {
      return NextResponse.json({ error: "Bill already paid" }, { status: 400 });
    }

    const amountInPaise = Math.round(Number(bill.amount) * 100);
    if (!amountInPaise || amountInPaise <= 0) {
      return NextResponse.json({ error: "Invalid bill amount" }, { status: 400 });
    }

    const order = await createRazorpayOrder({
      amountInPaise,
      receipt: `bill_${billId.slice(0, 8)}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      billId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
