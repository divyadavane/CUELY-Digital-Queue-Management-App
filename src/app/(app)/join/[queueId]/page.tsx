"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTicketRealtime } from "@/hooks/useTicketRealtime";
import { useQueueGraphData } from "@/hooks/useQueueGraphData";
import { JoinForm } from "@/components/track/JoinForm";
import { DepartmentDoctorWizard } from "@/components/patient/DepartmentDoctorWizard";
import { Database } from "@/types/database";

type Queue = Database["public"]["Tables"]["queues"]["Row"];
import { BookAppointmentForm } from "@/components/customer/BookAppointmentForm";
import { CheckInPrompt } from "@/components/customer/CheckInPrompt";
import { LiveTrackingCard } from "@/components/track/LiveTrackingCard";
import { LiveQueueGraph } from "@/components/customer/LiveQueueGraph";
import { QueueInactiveState } from "@/components/track/QueueInactiveState";
import { QueuePausedState } from "@/components/track/QueuePausedState";
import { Loader2, Users, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function JoinCustomerPage() {
  const params = useParams();
  const queueId = params.queueId as string;

  const [mode, setMode] = useState<"join" | "book">("join");
  const [storedTicketId, setStoredTicketId] = useState<string | null>(null);
  const [storedAppt, setStoredAppt] = useState<{ id: string; date: string } | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load stored ticket & appointment on mount
  useEffect(() => {
    if (!queueId) return;
    const ticketKey = `cuely_ticket_${queueId}`;
    const apptKey = `cuely_appointment_${queueId}`;

    const tStored = localStorage.getItem(ticketKey);
    if (tStored) setStoredTicketId(tStored);

    const aStored = localStorage.getItem(apptKey);
    if (aStored) {
      try {
        setStoredAppt(JSON.parse(aStored));
      } catch (e) {
        localStorage.removeItem(apptKey);
      }
    }
    setStorageLoaded(true);
  }, [queueId]);

  const { ticket, queue, position, estimatedWaitMinutes, loading } = useTicketRealtime(storedTicketId, queueId);
  const graphData = useQueueGraphData(queueId, storedTicketId);

  const handleJoin = (newTicketId: string) => {
    localStorage.setItem(`cuely_ticket_${queueId}`, newTicketId);
    setStoredTicketId(newTicketId);
  };

  const handleBooked = (appointmentId: string, date: string) => {
    const data = { id: appointmentId, date };
    localStorage.setItem(`cuely_appointment_${queueId}`, JSON.stringify(data));
    setStoredAppt(data);
  };

  const handleClearTicket = () => {
    localStorage.removeItem(`cuely_ticket_${queueId}`);
    setStoredTicketId(null);
  };

  const handleClearAppt = () => {
    localStorage.removeItem(`cuely_appointment_${queueId}`);
    setStoredAppt(null);
  };

  if (!storageLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-medium">Loading queue...</p>
      </div>
    );
  }

  if (!queue || !queue.is_active) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <QueueInactiveState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 md:px-8 border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center font-bold text-sm">
              C
            </div>
            <span className="text-xl font-bold font-sans tracking-tight text-foreground">
              Cuely
            </span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-surface border border-border rounded-full text-muted-foreground">
            {queue.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-8 flex flex-col items-center">
        {storedTicketId && ticket ? (
          <div className="w-full max-w-xl">
            <LiveTrackingCard
              ticket={ticket}
              position={position}
              estimatedWaitMinutes={estimatedWaitMinutes}
              onClear={handleClearTicket}
            />

            {/* Real-time Queue Bar Chart */}
            <LiveQueueGraph items={graphData} />
          </div>
        ) : storedAppt ? (
          <CheckInPrompt
            appointmentId={storedAppt.id}
            appointmentDate={storedAppt.date}
            onCheckedIn={(ticketId) => {
              handleClearAppt();
              handleJoin(ticketId);
            }}
            onCancelled={handleClearAppt}
          />
        ) : queue.is_paused ? (
          <QueuePausedState />
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Mode Switcher Tabs */}
            <div className="flex bg-surface border border-border p-1.5 rounded-2xl mb-8 w-full max-w-md">
              <button
                onClick={() => setMode("join")}
                className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  mode === "join"
                    ? "bg-accent text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-4 h-4" />
                Join Queue Now
              </button>
              <button
                onClick={() => setMode("book")}
                className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  mode === "book"
                    ? "bg-accent text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Book for Later
              </button>
            </div>

            {mode === "join" ? (
              <div className="w-full">
                <JoinForm queue={queue} onJoin={(tid) => {
                  localStorage.setItem(`cuely_ticket_${queue.id}`, tid);
                  setStoredTicketId(tid);
                  // Reload to redirect to the new queue's tracking page
                  window.location.href = `/track/${queue.id}`;
                }} />
              </div>
            ) : (
              <BookAppointmentForm queueId={queueId} onBooked={handleBooked} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm font-medium text-muted-foreground border-t border-border/50">
        Powered by Cuely Digital Queue
      </footer>
    </div>
  );
}
