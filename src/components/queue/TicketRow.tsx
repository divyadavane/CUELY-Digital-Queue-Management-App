"use client";

import type { Ticket } from "@/types/database";
import StatusBadge from "@/components/ui/StatusBadge";

interface TicketRowProps {
  ticket: Ticket;
  position: number;
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
  if (!phone) return "—";
  if (phone.length <= 4) return phone;
  return "•••• " + phone.slice(-4);
}

export default function TicketRow({ ticket, position }: TicketRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-surface rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Left: Position + Token */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-bg rounded-lg flex items-center justify-center">
          <span className="text-xs font-semibold text-text-muted">{position}</span>
        </div>
        <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center">
          <span className="text-lg font-bold text-white">{ticket.token_number}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-heading">
            Token #{ticket.token_number}
          </p>
          <p className="text-xs text-text-muted">
            {maskPhone(ticket.customer_phone)}
          </p>
        </div>
      </div>

      {/* Right: Status + Time */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-text-muted whitespace-nowrap">
          {formatTimeAgo(ticket.joined_at)}
        </span>
        <StatusBadge status={ticket.status} />
      </div>
    </div>
  );
}
