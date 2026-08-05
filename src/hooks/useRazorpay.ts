"use client";

import { useState } from "react";
import { getPortalToken } from "@/lib/portal/client";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  on: (event: string, handler: (response: any) => void) => void;
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export class PaymentError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "PaymentError";
    this.status = status;
  }
}

/**
 * Reusable Razorpay flow: load checkout.js, create an order server-side for a
 * bill owned by the current portal session, open the checkout, then verify.
 * `onSuccess` fires after the signature is verified.
 */
export function useRazorpay() {
  const [paying, setPaying] = useState(false);
  const [payEnabled, setPayEnabled] = useState(true);

  const payBill = async (
    billId: string,
    description: string,
    onSuccess: () => void
  ) => {
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new PaymentError("Unable to load the payment gateway", 503);
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = getPortalToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/portal/payments/create", {
        method: "POST",
        headers,
        body: JSON.stringify({ billId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new PaymentError(data?.error || "Failed to start payment", res.status);

      const keyRes = await fetch("/api/portal/payments/key", { headers });
      const keyBody = await keyRes.json().catch(() => ({}));

      const { order_id, amount, currency } = data as { order_id: string; amount: number; currency: string };

      const razorpay = new window.Razorpay!({
        key: keyBody?.key || "",
        amount,
        currency,
        name: "Cuely",
        description,
        order_id,
        handler: async (response) => {
          const verify = await fetch("/api/portal/payments/verify", {
            method: "POST",
            headers,
            body: JSON.stringify({
              billId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const vData = await verify.json().catch(() => ({}));
          if (!verify.ok) throw new PaymentError(vData?.error || "Payment verification failed");
          onSuccess();
        },
      });

      razorpay.on("payment.failed", () => {
        throw new PaymentError("Payment was not completed");
      });

      razorpay.open();
    } catch (e: any) {
      if (e?.status === 503) setPayEnabled(false);
      throw e;
    } finally {
      setPaying(false);
    }
  };

  return { payBill, paying, payEnabled };
}
