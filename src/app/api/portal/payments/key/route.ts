import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { razorpayConfigured } from "@/lib/razorpay";

// GET /api/portal/payments/key
// Exposes only the public Razorpay Key ID to an authenticated portal session.
// The Key Secret never leaves the server.
export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({ key: "" });
  }

  return NextResponse.json({ key: process.env.RAZORPAY_KEY_ID });
}
