"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { Clock, Users, CheckCircle2, MessageSquare, Volume2, VolumeX, LayoutDashboard } from "lucide-react";
import { LiveQueueGraph } from "@/components/customer/LiveQueueGraph";
import { useQueueGraphData } from "@/hooks/useQueueGraphData";
import { CuelyLogo } from "@/components/ui/CuelyLogo";
import { RatingPrompt } from "@/components/patient/RatingPrompt";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface PatientStatusPageProps {
  initialTicket: Ticket;
  clinicName?: string;
}

export function PatientStatusPage({ initialTicket, clinicName = "Sunrise Clinic" }: PatientStatusPageProps) {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-start p-4 md:p-6 relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-4 border-b border-[var(--border-color)] mb-6">
        <div className="flex items-center gap-2.5">
          <CuelyLogo size="sm" showGlow />
          <div>
            <h1 className="font-bold text-base font-sans text-[var(--text-primary)]">{clinicName}</h1>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">{t("status.livePortal")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher align="right" />
          <a
            href="/portal/login"
            className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title={t("status.openPortal")}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-500" />
          </a>
          <button
            onClick={() => setIsAudioEnabled((prev) => !prev)}
            className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title={isAudioEnabled ? t("status.audioOn") : t("status.audioMuted")}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
        </div>
      </header>

      {/* Main Ticket Card */}
      <main className="w-full max-w-md mx-auto space-y-6">
        <div
          className={`p-6 md:p-8 rounded-3xl border text-center transition-all shadow-xl relative overflow-hidden ${
            isCalled
              ? "bg-blue-600/15 border-blue-500/60 shadow-[0_0_35px_rgba(59,130,246,0.3)] animate-pulse"
              : isServed
              ? "bg-emerald-600/15 border-emerald-500/40"
              : "bg-[var(--bg-card)] border-[var(--border-color)]"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1">
            {t("status.yourToken")}
          </span>
          <div className="text-6xl font-black font-sans text-amber-500 tracking-tight my-2">
            #{ticket.token_number}
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{ticket.customer_name || t("common.patient")}</h2>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
            <span className={`w-2 h-2 rounded-full ${isCalled ? "bg-blue-500 animate-ping" : isServed ? "bg-emerald-500" : "bg-amber-500"}`} />
            {t(`common.status.${ticket.status}`)}
          </div>

          {/* Call Notice Banner */}
          {isCalled && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-extrabold shadow-lg animate-bounce">
              🚨 {t("status.itYourTurn")}
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
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{t("status.position")}</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-black font-sans text-[var(--text-primary)]">
                {isCalled ? t("status.next") : t("status.inLine", { n: positionInLine })}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium mt-1">{t("status.liveQueueStatus")}</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{t("status.estWait")}</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-3xl font-black font-sans text-[var(--text-primary)]">
                {isCalled ? t("status.zeroWait") : t("status.estWaitValue", { n: estWaitMins })}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium mt-1">{t("status.updatedRealtime")}</span>
            </div>
          </div>
        )}

        {/* Queue Visualizer Graph */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">{t("status.positionGraph")}</h3>
          <LiveQueueGraph items={items} />
        </div>

        {/* Notification Preferences */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl space-y-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>{t("status.notificationPrefs")}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[var(--text-secondary)]">{t("status.whatsappUpdates")}</span>
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
