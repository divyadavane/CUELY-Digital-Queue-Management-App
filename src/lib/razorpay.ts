import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_API = "https://api.razorpay.com/v1";

export function razorpayConfigured(): boolean {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
}

export interface RazorpayOrder {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: string;
}

export async function createRazorpayOrder(opts: {
  amountInPaise: number;
  currency?: string;
  receipt: string;
}): Promise<RazorpayOrder> {
  if (!razorpayConfigured()) {
    throw new Error("Razorpay is not configured on the server");
  }

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amountInPaise,
      currency: opts.currency || "INR",
      receipt: opts.receipt,
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.description || body?.error?.reason || "Failed to create Razorpay order");
  }

  return {
    id: body.id,
    amount: body.amount,
    currency: body.currency,
    receipt: body.receipt,
    status: body.status,
  };
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
