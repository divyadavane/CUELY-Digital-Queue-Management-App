"use client";

import { useState, useEffect } from "react";
import { Check, UserX, RotateCcw, Star, HelpCircle, MessageSquare, ArrowRightLeft } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { PriorityControl } from "./PriorityControl";
import { useUndoableAction } from "@/hooks/useUndoableAction";
import { recallTicketAction } from "@/actions/queue";
import { calculateUrgency } from "@/lib/urgency";
import { TransferTicketModal } from "./TransferTicketModal";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface TicketRowProps {
  ticket: Ticket;
  adminRole?: string;
  currentUserId?: string;
  queues?: Queue[];
}

export function TicketRow({ ticket, adminRole, currentUserId, queues = [] }: TicketRowProps) {
  const [loadingAction, setLoadingAction] = useState<"serve" | "noshow" | "recall" | null>(null);
  const [timeWaiting, setTimeWaiting] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const supabase = createClient();
  const { executeActionWithUndo } = useUndoableAction();

  const urgency = calculateUrgency(ticket);

  useEffect(() => {
    const updateWaitTime = () => {
      const joined = new Date(ticket.joined_at).getTime();
      const now = Date.now();
      const diffMins = Math.floor((now - joined) / 60000);
      setTimeWaiting(diffMins > 0 ? `${diffMins}m` : "< 1m");
    };

    updateWaitTime();
    const interval = setInterval(updateWaitTime, 60000);
    return () => clearInterval(interval);
  }, [ticket.joined_at]);

  const handleRecall = async () => {
    setLoadingAction("recall");
    const { success, error } = await recallTicketAction(ticket.id);

    if (error || !success) {
      toast.error(error || "Failed to recall patient");
    } else {
      toast.success(`Recalled Token #${ticket.token_number}`);
    }
    setLoadingAction(null);
  };

  const handleAction = async (action: "serve" | "noshow") => {
    setLoadingAction(action);
    const rpcName = action === "serve" ? "mark_served" : "mark_no_show";

    await executeActionWithUndo(
      ticket.id,
      () => supabase.rpc(rpcName, { p_ticket_id: ticket.id }),
      action === "serve" ? "Ticket served" : "Marked as no-show"
    );
  };

  const isCalled = ticket.status === "called";
  const isSomeoneElsesTicket = isCalled && ticket.served_by !== null && ticket.served_by !== currentUserId;

  return (
    <div
      className={`
      relative p-4 md:p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-300 border overflow-hidden w-full max-w-full
      ${
        isCalled
          ? "bg-blue-950/40 border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.2)]"
          : "bg-surface/50 backdrop-blur-xl border-white/10 hover:border-white/20 hover:bg-surface/70 shadow-lg"
      }
    `}
    >
      {/* Ticket Info */}
      <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
        <div
          className={`
          flex flex-col items-center justify-center w-14 h-14 rounded-2xl font-bold shrink-0 transition-transform duration-300
          ${
            isCalled
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse-ring"
              : "bg-surface border border-white/10 text-foreground"
          }
        `}
        >
          <span className="text-xl font-black font-sans tracking-tight">#{ticket.token_number}</span>
          {ticket.priority > 0 && <Star className="w-3 h-3 text-amber-300 fill-amber-300 mt-0.5" />}
        </div>

        <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Pill */}
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                isCalled
                  ? "bg-blue-500/20 text-blue-300 border-blue-400/40 shadow-sm"
                  : "bg-slate-500/15 text-slate-400 border-slate-500/30"
              }`}
            >
              {ticket.status}
            </span>

            {/* Urgency Pill Badge */}
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all ${urgency.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotClass}`} />
                {urgency.label}
                <HelpCircle className="w-3 h-3 opacity-80 hover:opacity-100" />
              </button>

              {/* Urgency Breakdown Tooltip */}
              {showTooltip && (
                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-900/95 border border-white/20 rounded-2xl shadow-2xl z-50 text-xs text-white backdrop-blur-xl animate-in fade-in duration-200 pointer-events-none">
                  <div className="font-bold text-amber-300 mb-1 flex items-center justify-between">
                    <span>Clinical Score: {urgency.score}/100</span>
                    <span className="text-[10px] uppercase text-slate-400 font-mono">{urgency.level}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-300 mb-1.5">Factors influencing priority:</p>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    {urgency.factors.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <span className="text-xs font-semibold text-muted-foreground ml-1">
              Wait: <strong className="text-foreground">{timeWaiting}</strong>
            </span>

            {ticket.priority > 0 && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Priority Tier {ticket.priority}
              </span>
            )}
            {ticket.recall_count > 0 && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Recalled ×{ticket.recall_count}
              </span>
            )}
          </div>

          <p className="text-base md:text-lg font-extrabold font-sans text-foreground flex items-center gap-2 min-w-0 flex-wrap">
            <span className="truncate max-w-[180px] sm:max-w-[280px]">{ticket.customer_name || "Patient"}</span>
            <span className="text-xs font-normal text-muted-foreground shrink-0 flex items-center gap-1.5">
              {ticket.customer_phone ? (
                <>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs font-bold border border-white/15">
                    {ticket.customer_phone}
                  </span>
                  {/* WhatsApp Status Badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5" /> WhatsApp Active
                  </span>
                  {/* Send WhatsApp Quick Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      toast.promise(
                        import("@/actions/whatsappActions").then(async (m) => {
                          const res = await m.resendWhatsAppAction(ticket.id);
                          if (!res.success) {
                            throw new Error(res.error || "WhatsApp delivery failed");
                          }
                          return res;
                        }),
                        {
                          loading: "Sending automatic WhatsApp message in background...",
                          success: "WhatsApp message sent automatically to patient!",
                          error: (err: any) => `WhatsApp Error: ${err.message || "Failed to send WhatsApp message"}`,
                        }
                      );
                    }}
                    className="p-1 px-2.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Automatically Send WhatsApp Alert in Background"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Send WhatsApp</span>
                  </button>
                </>
              ) : (
                "(Walk-in)"
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 max-w-full overflow-hidden">
        {queues && queues.length > 1 && (
          <button
            type="button"
            onClick={() => setIsTransferOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 border border-white/10 transition-all"
            title="Transfer patient to another department"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transfer</span>
          </button>
        )}

        {!isCalled && adminRole === "owner" && (
          <PriorityControl ticketId={ticket.id} currentPriority={ticket.priority} />
        )}

        {isCalled && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Recall Button */}
            <button
              onClick={handleRecall}
              disabled={loadingAction !== null || isSomeoneElsesTicket}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-all duration-300 text-xs whitespace-nowrap active:scale-95 disabled:opacity-50"
              title="Recall (R)"
            >
              {loadingAction === "recall" ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recall</span>
                </>
              )}
            </button>

            {/* No Show Button */}
            <button
              onClick={() => handleAction("noshow")}
              disabled={loadingAction !== null || isSomeoneElsesTicket}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all duration-300 text-xs whitespace-nowrap active:scale-95 disabled:opacity-50"
              title="No Show (X)"
            >
              {loadingAction === "noshow" ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>No Show</span>
                </>
              )}
            </button>

            {/* Mark Served Button */}
            <button
              onClick={() => handleAction("serve")}
              disabled={loadingAction !== null || isSomeoneElsesTicket}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition-all duration-300 text-xs whitespace-nowrap active:scale-95 disabled:opacity-50"
              title="Mark Served (S)"
            >
              {loadingAction === "serve" ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Served</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <TransferTicketModal
        ticket={ticket}
        queues={queues}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />
    </div>
  );
}
