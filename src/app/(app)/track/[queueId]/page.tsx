"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTicketRealtime } from "@/hooks/useTicketRealtime";
import { JoinForm } from "@/components/track/JoinForm";
import { LiveTrackingCard } from "@/components/track/LiveTrackingCard";
import { QueueInactiveState } from "@/components/track/QueueInactiveState";
import { QueuePausedState } from "@/components/track/QueuePausedState";
import { LiveQueueGraph } from "@/components/customer/LiveQueueGraph";
import { useQueueGraphData } from "@/hooks/useQueueGraphData";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { CuelyLogo } from "@/components/ui/CuelyLogo";
import { PatientChatWidget } from "@/components/patient/PatientChatWidget";
import { DepartmentDoctorWizard } from "@/components/patient/DepartmentDoctorWizard";
import { Database } from "@/types/database";

type Queue = Database["public"]["Tables"]["queues"]["Row"];

export default function TrackPage() {
  const params = useParams();
  const queueId = params.queueId as string;
  
  const [storedTicketId, setStoredTicketId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load stored ticket on mount
  useEffect(() => {
    const key = `cuely_ticket_${queueId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setStoredTicketId(stored);
    }
    setStorageLoaded(true);
  }, [queueId]);

  const { ticket, queue, position, estimatedWaitMinutes, loading } = useTicketRealtime(storedTicketId, queueId);
  const graphData = useQueueGraphData(queueId, storedTicketId);

  const handleJoin = (newTicketId: string) => {
    localStorage.setItem(`cuely_ticket_${queueId}`, newTicketId);
    setStoredTicketId(newTicketId);
  };

  const handleClearTicket = () => {
    localStorage.removeItem(`cuely_ticket_${queueId}`);
    setStoredTicketId(null);
  };

  const isStale = false; 

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
          <Link href="/" className="flex items-center gap-2 group">
            <CuelyLogo size="sm" showGlow className="group-hover:scale-105" />
            <span className="text-xl font-bold font-sans tracking-tight text-foreground">
              Cuely
            </span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-surface border border-border rounded-full text-muted-foreground">
            {queue.name}
          </span>
          <Link
            href="/portal/login"
            className="text-xs font-bold px-3 py-1 bg-accent/10 border border-accent/30 text-accent rounded-full hover:bg-accent/20 transition-all"
          >
            My Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 py-8 max-w-4xl w-full mx-auto">
        {!storedTicketId || !ticket ? (
          queue.is_paused ? (
            <QueuePausedState />
          ) : (
            <div className="w-full">
              <h2 className="text-2xl font-bold mb-4 text-center">Welcome</h2>
              <p className="text-muted-foreground mb-6 text-center">Please fill out the form to join the queue.</p>
              <JoinForm 
                queue={queue} 
                onJoin={handleJoin} 
              />
            </div>
          )
        ) : (
          <div className="w-full max-w-xl">
            <LiveTrackingCard 
              ticket={ticket} 
              position={position} 
              estimatedWaitMinutes={estimatedWaitMinutes}
              onClear={handleClearTicket}
              isStale={isStale}
            />

            <LiveQueueGraph items={graphData} />
          </div>
        )}
      </main>
      
      {queue.business_id && <PatientChatWidget ticketId={ticket?.id} businessId={queue.business_id} />}

      {/* Footer */}
      <footer className="py-6 text-center text-sm font-medium text-muted-foreground">
        Powered by Cuely
      </footer>
    </div>
  );
}
