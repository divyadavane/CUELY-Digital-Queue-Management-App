"use client";

import type { Ticket } from "@/types/database";

interface CalledTicketProps {
  ticket: Ticket;
  onMarkServed: (ticketId: string) => void;
  onMarkNoShow: (ticketId: string) => void;
  actionLoading: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function maskPhone(phone: string | null): string {
  if (!phone) return "No phone";
  if (phone.length <= 4) return phone;
  return "•••• " + phone.slice(-4);
}

export default function CalledTicket({ ticket, onMarkServed, onMarkNoShow, actionLoading }: CalledTicketProps) {
  return (
    <div className="bg-accent/5 border-2 border-accent rounded-xl p-6 shadow-lg shadow-accent/10 relative overflow-hidden">
      {/* Animated accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
      <div className="absolute top-0 left-0 h-1 bg-white/50 animate-pulse" style={{ width: "30%" }} />

      <div className="flex items-center justify-between">
        {/* Left: Token info */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center shadow-md">
            <span className="text-2xl font-extrabold text-white">
              {ticket.token_number}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                🔔 Now Serving
              </span>
            </div>
            <p className="text-lg font-bold text-text-heading">
              Token #{ticket.token_number}
            </p>
            <p className="text-sm text-text-muted">
              {maskPhone(ticket.customer_phone)} · Called {formatTimeAgo(ticket.called_at!)}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onMarkServed(ticket.id)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-3 bg-status-served text-white font-semibold rounded-xl
                       hover:bg-status-served/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md shadow-status-served/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Mark Served
          </button>
          <button
            onClick={() => onMarkNoShow(ticket.id)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-3 bg-status-noshow text-white font-semibold rounded-xl
                       hover:bg-status-noshow/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md shadow-status-noshow/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            No Show
          </button>
        </div>
      </div>
    </div>
  );
}
