"use client";

import React, { useState } from "react";
import { ArrowRightLeft, X, Check, Building2, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";

type Queue = Database["public"]["Tables"]["queues"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface TransferTicketModalProps {
  ticket: Ticket;
  queues: Queue[];
  isOpen: boolean;
  onClose: () => void;
  onTransferred?: () => void;
}

const COUNTERS = [
  "Counter 1 (General OPD)",
  "Counter 2 (Pediatrics / Child Care)",
  "Counter 3 (Dental Room 104)",
  "Counter 4 (Cardiology)",
  "Counter 5 (Lab & Diagnostics)",
];

export function TransferTicketModal({
  ticket,
  queues,
  isOpen,
  onClose,
  onTransferred,
}: TransferTicketModalProps) {
  const [selectedQueueId, setSelectedQueueId] = useState(ticket.queue_id);
  const [selectedCounter, setSelectedCounter] = useState(COUNTERS[0]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          queue_id: selectedQueueId,
          // Re-queue ticket into waiting status for the target department
          status: "waiting",
        })
        .eq("id", ticket.id);

      if (error) throw error;

      // Log activity transfer event
      await supabase.from("queue_activity_log").insert({
        queue_id: selectedQueueId,
        ticket_id: ticket.id,
        action: "transfer_department",
        metadata: {
          from_queue: ticket.queue_id,
          to_queue: selectedQueueId,
          assigned_counter: selectedCounter,
        },
      });

      toast.success(`Token #${ticket.token_number} transferred successfully!`);
      if (onTransferred) onTransferred();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to transfer token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-sans text-white">Transfer Patient Token</h3>
              <p className="text-xs text-slate-400">Reassign department or counter mid-queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Details Summary */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Patient Token</span>
            <span className="text-lg font-black text-white font-sans">
              #{ticket.token_number} &mdash; {ticket.customer_name || "Patient"}
            </span>
          </div>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            {ticket.status.toUpperCase()}
          </span>
        </div>

        {/* Target Department Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            Target Department
          </label>
          <select
            value={selectedQueueId}
            onChange={(e) => setSelectedQueueId(e.target.value)}
            className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-blue-500 transition-all"
          >
            {queues.map((q) => (
              <option key={q.id} value={q.id} className="bg-slate-900 text-white">
                {q.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Counter Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-400" />
            Assign Counter / Doctor Room
          </label>
          <select
            value={selectedCounter}
            onChange={(e) => setSelectedCounter(e.target.value)}
            className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-amber-500 transition-all"
          >
            {COUNTERS.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-white">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleTransfer}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
