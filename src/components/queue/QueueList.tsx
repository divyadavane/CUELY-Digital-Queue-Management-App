"use client";

import type { Ticket } from "@/types/database";
import TicketRow from "./TicketRow";
import EmptyQueue from "./EmptyQueue";

interface QueueListProps {
  tickets: Ticket[];
}

export default function QueueList({ tickets }: QueueListProps) {
  if (tickets.length === 0) {
    return <EmptyQueue />;
  }

  return (
    <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-text-heading uppercase tracking-wider">
          Waiting List
        </h2>
      </div>
      <div className="p-3 space-y-2">
        {tickets.map((ticket, index) => (
          <TicketRow key={ticket.id} ticket={ticket} position={index + 1} />
        ))}
      </div>
    </div>
  );
}
