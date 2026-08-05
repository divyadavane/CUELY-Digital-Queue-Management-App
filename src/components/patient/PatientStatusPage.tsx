"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { Clock, Users, CheckCircle2, MessageSquare, Volume2, VolumeX, LayoutDashboard } from "lucide-react";
import { LiveQueueGraph } from "@/components/customer/LiveQueueGraph";
import { useQueueGraphData } from "@/hooks/useQueueGraphData";
import { CuelyLogo } from "@/components/ui/CuelyLogo";
import { RatingPrompt } from "@/components/patient/RatingPrompt";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface PatientStatusPageProps {
  initialTicket: Ticket;
  clinicName?: string;
}

export function PatientStatusPage({ initialTicket, clinicName = "Sunrise Clinic" }: PatientStatusPageProps) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [positionInLine, setPositionInLine] = useState<number>(1);
  const [estWaitMins, setEstWaitMins] = useState<number>(5);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [smsConsent, setSmsConsent] = useState(true);
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  const items = useQueueGraphData(ticket.queue_id, ticket.id);

  const supabase = createClient();

  useEffect(() => {
    // 1. Calculate live queue position
    async function calculatePosition() {
      const { data: waitingTickets } = await supabase
        .from("tickets")
        .select("id, joined_at")
        .eq("queue_id", ticket.queue_id)
        .eq("status", "waiting")
        .order("joined_at", { ascending: true });

      if (waitingTickets) {
        const index = waitingTickets.findIndex((t: any) => t.id === ticket.id);
        const pos = index >= 0 ? index + 1 : 1;
        setPositionInLine(pos);
        setEstWaitMins(pos * 6);
      }
    }

    calculatePosition();

    // 2. Realtime listener for ticket updates
    const channel = supabase
      .channel(`public:tickets:id=eq.${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        (payload: any) => {
          const updated = payload.new as Ticket;
          setTicket(updated);

          // Audio notification when called
          if (updated.status === "called" && isAudioEnabled) {
            try {
              const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
              audio.play().catch(() => {});
            } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id, ticket.queue_id, isAudioEnabled, supabase]);

  const isCalled = ticket.status === "called";
  const isServed = ticket.status === "served";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start p-4 md:p-6 relative overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-2.5">
          <CuelyLogo size="sm" showGlow />
          <div>
            <h1 className="font-bold text-base font-sans text-white">{clinicName}</h1>
            <p className="text-[11px] text-slate-400 font-medium">Live Patient Queue Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/portal/login"
            className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all"
            title="Open My Patient Portal"
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
          </a>
          <button
            onClick={() => setIsAudioEnabled((prev) => !prev)}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            title={isAudioEnabled ? "Audio alerts enabled" : "Audio muted"}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Main Ticket Card */}
      <main className="w-full max-w-md mx-auto space-y-6">
        <div
          className={`p-6 md:p-8 rounded-3xl border text-center transition-all shadow-2xl relative overflow-hidden ${
            isCalled
              ? "bg-blue-950/80 border-blue-500/60 shadow-[0_0_35px_rgba(59,130,246,0.3)] animate-pulse"
              : isServed
              ? "bg-emerald-950/60 border-emerald-500/40"
              : "bg-slate-900/90 border-white/15"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
            Your Token Number
          </span>
          <div className="text-6xl font-black font-sans text-amber-400 tracking-tight my-2">
            #{ticket.token_number}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{ticket.customer_name || "Patient"}</h2>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-wider text-white">
            <span className={`w-2 h-2 rounded-full ${isCalled ? "bg-blue-400 animate-ping" : isServed ? "bg-emerald-400" : "bg-amber-400"}`} />
            Status: {ticket.status.toUpperCase()}
          </div>

          {/* Call Notice Banner */}
          {isCalled && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-extrabold shadow-lg animate-bounce">
              🚨 IT'S YOUR TURN! Please proceed to Desk / Room 1 now.
            </div>
          )}
        </div>

        {/* Rating Prompt after visit */}
        {isServed && (
          <RatingPrompt queueId={ticket.queue_id} ticketId={ticket.id} patientName={ticket.customer_name ?? undefined} doctorName={clinicName} />
        )}

        {/* Live Metrics Grid */}
        {!isServed && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900/80 border border-white/10 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Position</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black font-sans text-white">
                {isCalled ? "0 (Next)" : `${positionInLine} in line`}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1">Live queue status</span>
            </div>

            <div className="p-5 bg-slate-900/80 border border-white/10 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Est. Wait</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-black font-sans text-white">
                {isCalled ? "0m" : `~${estWaitMins}m`}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1">Updated in real-time</span>
            </div>
          </div>
        )}

        {/* Queue Visualizer Graph */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3">Live Queue Position Graph</h3>
          <LiveQueueGraph items={items} />
        </div>

        {/* Notification Preferences */}
        <div className="p-5 bg-slate-900/80 border border-white/10 rounded-3xl space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <MessageSquare className="w-4 h-4 text-accent" />
            <span>Notification Preferences</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Receive WhatsApp Instant Ticket Updates</span>
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
