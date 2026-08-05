"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Sparkles,
  Stethoscope,
  Ticket,
  UserPlus,
} from "lucide-react";
import { portalApi } from "@/lib/portal/client";
import { createClient } from "@/lib/supabase";
import { PortalCard, SectionTitle, StatusPill } from "@/components/portal/ui";

interface DashboardData {
  activeTicket: any | null;
  upcomingAppointment: any | null;
  recentAppointment: any | null;
}

interface DashboardSectionProps {
  patientName?: string | null;
  onNavigate: (tab: string) => void;
}

const STEP_ORDER = ["waiting", "called", "serving", "served"];

export function DashboardSection({ patientName, onNavigate }: DashboardSectionProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await portalApi<DashboardData>("/api/portal/dashboard");
      setData(res);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live-update the active ticket status without refreshing the page
  useEffect(() => {
    const ticketId = data?.activeTicket?.id;
    if (!ticketId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`portal-ticket-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.activeTicket?.id]);

  const firstName = (patientName || "").trim().split(" ")[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
        <p className="text-xs font-semibold">Loading your dashboard...</p>
      </div>
    );
  }

  const active = data?.activeTicket || null;
  const activeStep = active ? STEP_ORDER.indexOf(active.status) : -1;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">
          {firstName ? `Hi ${firstName}` : "Welcome back"} 👋
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Here&apos;s what&apos;s happening with your care.
        </p>
      </div>

      {/* Active Ticket */}
      {active ? (
        <PortalCard className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Ticket className="w-4 h-4 text-blue-400" />
                Live Queue Ticket
              </div>
              <StatusPill status={active.status} />
            </div>

            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-slate-400">Token Number</p>
                <p className="text-5xl font-black text-amber-400 tracking-tight">
                  #{active.token_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400">Doctor</p>
                <p className="text-sm font-bold text-white">
                  {active.queues?.doctor_name || active.queues?.name || "Queue"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">{active.queues?.department}</p>
              </div>
            </div>

            {/* Live status steps */}
            <div className="flex items-center gap-1.5">
              {STEP_ORDER.map((step, i) => (
                <div key={step} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      i < activeStep
                        ? "bg-emerald-400"
                        : i === activeStep
                        ? active.status === "serving"
                          ? "bg-cyan-400"
                          : "bg-blue-400 animate-pulse"
                        : "bg-white/10"
                    }`}
                  />
                  <p
                    className={`mt-1.5 text-[9px] font-bold uppercase tracking-wide ${
                      i <= activeStep ? "text-blue-300" : "text-slate-500"
                    }`}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {active.status === "called" && (
              <div className="mt-4 p-3 bg-blue-500/15 border border-blue-500/40 rounded-2xl text-blue-200 text-xs font-bold text-center animate-pulse">
                It&apos;s your turn — please proceed to {active.queues?.counter_number || "the desk"}.
              </div>
            )}
          </div>
        </PortalCard>
      ) : (
        <EmptyStateCard onNavigate={onNavigate} />
      )}

      {/* Next Appointment */}
      <div>
        <SectionTitle title="Appointments" />
        {data?.upcomingAppointment ? (
          <PortalCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {data.upcomingAppointment.queues?.doctor_name ||
                      data.upcomingAppointment.queues?.name ||
                      "Appointment"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {formatDate(data.upcomingAppointment.appointment_date)}
                    {data.upcomingAppointment.appointment_time
                      ? ` · ${formatTime(data.upcomingAppointment.appointment_time)}`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("appointments")}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-300 hover:text-blue-200 shrink-0"
              >
                View <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </PortalCard>
        ) : (
          <PortalCard className="p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">No upcoming appointments</p>
              <p className="text-[11px] text-slate-400 font-medium">Book your next visit in seconds.</p>
            </div>
          </PortalCard>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <SectionTitle title="Quick Actions" />
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/patient"
            className="group bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 border border-white/10 hover:brightness-110 transition-all shadow-lg shadow-blue-900/30"
          >
            <UserPlus className="w-6 h-6 text-white mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-extrabold text-white">Join Queue</p>
            <p className="text-[10px] text-blue-100/80 font-medium mt-0.5">Pick a doctor & get a token</p>
          </Link>
          <button
            onClick={() => onNavigate("appointments")}
            className="text-left group bg-gradient-to-br from-purple-600 to-fuchsia-700 rounded-3xl p-5 border border-white/10 hover:brightness-110 transition-all shadow-lg shadow-purple-900/30"
          >
            <CalendarDays className="w-6 h-6 text-white mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-extrabold text-white">Book Appointment</p>
            <p className="text-[10px] text-purple-100/80 font-medium mt-0.5">Schedule a visit for later</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyStateCard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <PortalCard className="p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 pointer-events-none" />
      <div className="relative">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-300 mb-4">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-white">No active queue visit</h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
          You&apos;re not currently in a queue. Join one and track your token live right here.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Link
            href="/patient"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <UserPlus className="w-4 h-4" /> Join Queue
          </Link>
          <button
            onClick={() => onNavigate("appointments")}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <Sparkles className="w-4 h-4" /> Book
          </button>
        </div>
      </div>
    </PortalCard>
  );
}

export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
