"use client";

import { useState } from "react";
import { TicketRow } from "./TicketRow";
import { Database } from "@/types/database";
import { InboxIcon, ArrowUpDown, ShieldAlert, Clock } from "lucide-react";
import { calculateUrgency } from "@/lib/urgency";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface QueueListProps {
  tickets: Ticket[];
  loading: boolean;
  searchQuery?: string;
  adminRole?: string;
  currentUserId?: string;
  queues?: Queue[];
}

export function QueueList({
  tickets,
  loading,
  searchQuery = "",
  adminRole,
  currentUserId,
  queues = [],
}: QueueListProps) {
  const [sortBy, setSortBy] = useState<"arrival" | "urgency">("urgency");

  if (loading) {
    return (
      <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-8 w-40 bg-white/10 rounded-xl animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Filter based on searchQuery
  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const tokenMatch = t.token_number.toString().includes(lowerQuery);
    const phoneMatch = t.customer_phone?.toLowerCase().includes(lowerQuery);
    const nameMatch = t.customer_name?.toLowerCase().includes(lowerQuery);
    return tokenMatch || phoneMatch || nameMatch;
  });

  const calledTicket = filteredTickets.find((t) => t.status === "called");
  let waitingTickets = filteredTickets.filter((t) => t.status === "waiting");

  // Apply sorting for waiting tickets
  if (sortBy === "urgency") {
    waitingTickets = [...waitingTickets].sort((a, b) => {
      const urgencyA = calculateUrgency(a).score;
      const urgencyB = calculateUrgency(b).score;
      if (urgencyA !== urgencyB) return urgencyB - urgencyA; // Highest clinical urgency score first
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });
  } else {
    waitingTickets = [...waitingTickets].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });
  }

  if (filteredTickets.length === 0) {
    return (
      <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-xl min-h-[350px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
          <InboxIcon className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold font-sans text-foreground mb-2">
          {searchQuery ? "No matching patients" : "Queue is Empty"}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          {searchQuery ? "Try a different patient name, token # or phone number." : "No patients are currently waiting in line."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl">
      {/* List Header & Sort Toggle */}
      <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4 bg-white/5">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg font-sans text-foreground">Live Queue</h2>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
            {waitingTickets.length + (calledTicket ? 1 : 0)} Total Active
          </span>
        </div>

        {/* Sort Toggle Switch */}
        <div className="flex items-center bg-background border border-white/10 rounded-2xl p-1 text-xs font-bold">
          <button
            onClick={() => setSortBy("urgency")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              sortBy === "urgency"
                ? "bg-accent text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Clinical Priority
          </button>
          <button
            onClick={() => setSortBy("arrival")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              sortBy === "arrival"
                ? "bg-accent text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Arrival Order
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="p-4 md:p-6 space-y-4">
        {calledTicket && (
          <div className="mb-4">
            <TicketRow
              ticket={calledTicket}
              adminRole={adminRole}
              currentUserId={currentUserId}
              queues={queues}
            />
          </div>
        )}

        {waitingTickets.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            adminRole={adminRole}
            currentUserId={currentUserId}
            queues={queues}
          />
        ))}
      </div>
    </div>
  );
}
