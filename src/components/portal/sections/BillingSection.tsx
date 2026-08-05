"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Wallet, CreditCard, Loader2, ReceiptText } from "lucide-react";
import { portalApi } from "@/lib/portal/client";
import { PortalCard, SectionTitle, StatusPill, EmptyState, LoadingBlock } from "@/components/portal/ui";
import { formatDate } from "./DashboardSection";

interface Bill {
  id: string;
  amount: number;
  status: "paid" | "pending";
  description: string | null;
  paid_at?: string | null;
  created_at: string;
  tickets: { token_number: number; status: string } | null;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

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

export function BillingSection() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [payEnabled, setPayEnabled] = useState(true);

  const fetchBills = useCallback(async () => {
    try {
      const res = await portalApi<{ bills: Bill[] }>("/api/portal/bills");
      setBills(res.bills);
    } catch (e) {
      setBills([]);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const fetchRazorpayKey = async (): Promise<string> => {
    const res = await fetch("/api/portal/payments/key");
    const body = await res.json().catch(() => ({}));
    return body?.key || "";
  };

  const payBill = async (bill: Bill) => {
    setPaying(bill.id);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load the payment gateway. Try again.");
        return;
      }

      const { order_id, amount, currency } = await portalApi<{
        order_id: string;
        amount: number;
        currency: string;
      }>("/api/portal/payments/create", {
        method: "POST",
        body: JSON.stringify({ billId: bill.id }),
      });

      const key = await fetchRazorpayKey();

      const razorpay = new window.Razorpay!({
        key,
        amount,
        currency,
        name: "Cuely",
        description: bill.description || "Consultation",
        order_id,
        handler: async (response) => {
          try {
            await portalApi("/api/portal/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                billId: bill.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            toast.success("Payment successful!");
            await fetchBills();
          } catch (e: any) {
            toast.error(e?.message || "Payment confirmation failed");
          }
        },
      });

      razorpay.on("payment.failed", (response) => {
        toast.error(response?.error?.description || "Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (e: any) {
      if (e?.status === 503) {
        setPayEnabled(false);
        toast.error("Online payments are not enabled yet — visit the front desk to pay.");
      } else {
        toast.error(e?.message || "Failed to start payment");
      }
    } finally {
      setPaying(null);
    }
  };

  if (bills === null) return <LoadingBlock label="Loading bills..." />;

  const totalPending = bills.filter((b) => b.status === "pending").reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="space-y-5">
      <SectionTitle title="Billing" subtitle="Your bills and payment status" />

      {bills.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
          <p className="text-3xl font-black text-white mt-1">₹{totalPending.toFixed(2)}</p>
        </div>
      )}

      {!payEnabled && bills.some((b) => b.status === "pending") && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          Online payments are not enabled yet. Please visit the front desk to pay.
        </div>
      )}

      {bills.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="w-6 h-6" />}
          title="No bills yet"
          subtitle="Any bills tied to your visits will show up here with their amount and payment status."
        />
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <PortalCard key={b.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {b.description || "Consultation"}
                    {b.tickets ? ` · Token #${b.tickets.token_number}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {b.status === "paid" && b.paid_at
                      ? `Paid on ${formatDate(b.paid_at.slice(0, 10))}`
                      : formatDate(b.created_at.slice(0, 10))}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-white">₹{Number(b.amount).toFixed(2)}</p>
                  <div className="mt-1.5">
                    <StatusPill status={b.status} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {b.status === "paid" ? "Paid via Cuely" : "Pay securely with Razorpay"}
                </p>
                <button
                  disabled={b.status === "paid" || paying === b.id || !payEnabled}
                  onClick={() => payBill(b)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paying === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                  {b.status === "paid" ? "Paid" : "Pay Now"}
                </button>
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}
