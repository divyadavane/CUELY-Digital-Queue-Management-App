import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabaseService";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const maxDuration = 10;

// POST /api/portal/payments/verify
// body: { billId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Verifies the Razorpay signature and marks the bill as paid.
export async function POST(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const billId = String(body?.billId || "");
    const orderId = String(body?.razorpay_order_id || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature || "");

    if (!billId || !orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Incomplete payment details" }, { status: 400 });
    }

    if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: bill } = await supabase
      .from("bills")
      .select("id, patient_phone, status")
      .eq("id", billId)
      .eq("patient_phone", session.phone)
      .maybeSingle();

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    if (bill.status === "paid") {
      return NextResponse.json({ success: true, message: "Already paid" });
    }

    const { error } = await supabase
      .from("bills")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", billId)
      .eq("patient_phone", session.phone);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
