"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Wallet, IndianRupee, CheckCircle2, RotateCcw, Loader2, ReceiptText, Save } from "lucide-react";

interface BillItem {
  id: string;
  ticket_id: string | null;
  patient_phone: string | null;
  amount: number;
  status: "paid" | "pending";
  description: string | null;
  created_at: string;
  tickets: { token_number: number; status: string } | null;
}

interface BillingManagerProps {
  queueId: string;
  businessId: string;
  initialFee: number;
}

export function BillingManager({ queueId, businessId, initialFee }: BillingManagerProps) {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState<number>(initialFee || 0);
  const [savingFee, setSavingFee] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/bills?queueId=${queueId}`);
      if (!res.ok) return;
      const data = await res.json();
      setBills(data.bills || []);
    } catch (e) {
      console.error("Failed to fetch bills:", e);
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    fetchBills();
    const channel = supabase
      .channel(`public:bills:admin:${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bills",
          filter: `business_id=eq.${businessId}`,
        },
        () => fetchBills()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBills, businessId, supabase]);

  const saveFee = async () => {
    setSavingFee(true);
    const { error } = await supabase
      .from("queues")
      .update({ consultation_fee: fee })
      .eq("id", queueId);
    if (error) {
      toast.error(`Failed to update fee: ${error.message}`);
    } else {
      toast.success("Consultation fee updated");
    }
    setSavingFee(false);
  };

  const setStatus = async (bill: BillItem, status: "paid" | "pending") => {
    setUpdating(bill.id);
    const res = await fetch("/api/dashboard/bills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billId: bill.id, status }),
    });
    if (res.ok) {
      toast.success(status === "paid" ? "Bill marked as paid" : "Bill marked as pending");
      fetchBills();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error || "Failed to update bill");
    }
    setUpdating(null);
  };

  const pending = bills.filter((b) => b.status === "pending");
  const totalPending = pending.reduce((s, b) => s + Number(b.amount || 0), 0);
  const todayBills = bills.filter((b) => {
    const d = new Date(b.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground font-bold font-sans text-sm">
          <Wallet className="w-4 h-4 text-purple-400" />
          <span>Billing</span>
        </div>
        {!loading && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
            {pending.length} Pending
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding</p>
          <p className="text-2xl font-black text-white mt-0.5">₹{totalPending.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-purple-300" />
          <input
            type="number"
            min={0}
            step={0.01}
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="w-20 bg-slate-900 border border-white/15 rounded-xl px-2.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-accent"
            title="Consultation fee for this queue (auto-billed on join)"
          />
          <button
            type="button"
            onClick={saveFee}
            disabled={savingFee}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-all disabled:opacity-50"
            title="Save consultation fee (new tickets are billed this amount)"
          >
            {savingFee ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : todayBills.length === 0 ? (
        <div className="text-center py-6">
          <ReceiptText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No bills for today yet</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Bills are auto-created when a patient joins the queue.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {todayBills.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  Token #{b.tickets?.token_number ?? "-"}
                  {b.patient_phone ? ` · ${b.patient_phone}` : " · Walk-in"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {b.description || "Consultation"} · ₹{Number(b.amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {b.status === "paid" ? (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-full">
                    Pending
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setStatus(b, b.status === "paid" ? "pending" : "paid")}
                  disabled={updating === b.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 border bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  title={b.status === "paid" ? "Revert to pending" : "Mark as paid"}
                >
                  {updating === b.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : b.status === "paid" ? (
                    <RotateCcw className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  {b.status === "paid" ? "Undo" : "Mark Paid"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-500 font-medium">
        Patients can also pay online from the portal — status syncs here in real time.
      </p>
    </div>
  );
}
