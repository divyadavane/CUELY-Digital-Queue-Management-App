"use client";

import { Wallet, CheckCircle2, Clock3, XCircle } from "lucide-react";

export type BillStatus = "paid" | "pending" | "failed";

export interface BillInfo {
  id: string;
  ticket_id: string | null;
  patient_phone: string | null;
  amount: number;
  status: BillStatus;
  description: string | null;
  paid_at?: string | null;
  created_at: string;
  tickets: { token_number: number; status: string } | null;
}

const STATUS_CONFIG: Record<
  BillStatus,
  { dot: string; badge: string; label: string; icon: React.ReactNode }
> = {
  paid: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    label: "Paid",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pending: {
    dot: "bg-amber-400",
    badge: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    label: "Pending",
    icon: <Clock3 className="w-3 h-3" />,
  },
  failed: {
    dot: "bg-red-400",
    badge: "bg-red-500/15 border-red-500/30 text-red-300",
    label: "Failed",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export function BillStatusBadge({
  status,
  showIcon = true,
}: {
  status: BillStatus;
  showIcon?: boolean;
}) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}
      title={`Bill ${cfg.label.toLowerCase()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {showIcon && cfg.icon}
      {cfg.label}
    </span>
  );
}

export function BillingDetailSection({ bill }: { bill: BillInfo | null }) {
  if (!bill) return null;

  const amount = Number(bill.amount || 0);
  const status = bill.status;
  const paidDate = bill.paid_at
    ? new Date(bill.paid_at).toLocaleDateString("en-IN")
    : status === "paid"
      ? new Date(bill.created_at).toLocaleDateString("en-IN")
      : null;

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Wallet className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold text-white">
              {bill.description || "Consultation"}
              {bill.tickets ? ` · Token #${bill.tickets.token_number}` : ""}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {paidDate ? `Paid on ${paidDate}` : "Billing"}
            </p>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <span className="text-sm font-black text-white">₹{amount.toFixed(2)}</span>
          <BillStatusBadge status={status} />
        </div>
      </div>

      {status === "pending" && (
        <p className="text-[10px] text-amber-300/80 font-medium mt-2 flex items-center gap-1.5">
          <Clock3 className="w-3 h-3" />
          Payment pending — please confirm with front desk
        </p>
      )}
      {status === "failed" && (
        <p className="text-[10px] text-red-300/80 font-medium mt-2 flex items-center gap-1.5">
          <XCircle className="w-3 h-3" />
          Payment failed — please confirm with front desk
        </p>
      )}
    </div>
  );
}
