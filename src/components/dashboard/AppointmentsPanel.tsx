"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { CalendarDays, CalendarX2, LogIn, Phone, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { checkInAppointmentAction, cancelAppointmentAction } from "@/actions/queue";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentsPanelProps {
  queueId: string;
  doctorName: string;
  onCheckedIn?: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "Anytime";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${period}`;
}

export function AppointmentsPanel({ queueId, doctorName, onCheckedIn }: AppointmentsPanelProps) {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchAppointments = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("queue_id", queueId)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });
      setAppointments(data || []);
    } catch (e) {
      console.error("Failed to fetch appointments:", e);
      setAppointments([]);
    }
  }, [queueId, supabase]);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel(`public:appointments:doctor:${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments, queueId, supabase]);

  const handleCheckIn = async (appt: Appointment) => {
    setBusyId(appt.id);
    try {
      const res = await checkInAppointmentAction(appt.id);
      if (!res.success) {
        toast.error(res.error || "Check-in failed");
        return;
      }
      toast.success(`${appt.patient_name || "Patient"} checked in!`);
      await fetchAppointments();
      onCheckedIn?.();
    } catch (e: any) {
      toast.error(e?.message || "Check-in failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (appt: Appointment) => {
    if (!window.confirm(`Cancel appointment for ${appt.patient_name || "this patient"}?`)) return;
    setBusyId(appt.id);
    try {
      const res = await cancelAppointmentAction(appt.id);
      if (!res.success) {
        toast.error(res.error || "Cancel failed");
        return;
      }
      toast.success("Appointment cancelled");
      await fetchAppointments();
    } catch (e: any) {
      toast.error(e?.message || "Cancel failed");
    } finally {
      setBusyId(null);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = appointments?.filter((a) => a.appointment_date === todayStr) || [];
  const upcoming = appointments?.filter((a) => a.appointment_date > todayStr) || [];

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white font-sans">Booked Appointments</h2>
            <p className="text-xs text-slate-400">
              Scheduled visits for {doctorName} — check patients in when they arrive
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
            Today: {today.length}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold">
            Upcoming: {upcoming.length}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {appointments === null ? (
          <div className="p-10 text-center text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CalendarX2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">No upcoming appointments</h4>
            <p className="text-xs">Booked appointments for {doctorName} will appear here.</p>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-purple-400 mb-2">
                  Today's Appointments
                </p>
                <div className="space-y-3">
                  {today.map((appt) => (
                    <AppointmentRow
                      key={appt.id}
                      appt={appt}
                      busy={busyId === appt.id}
                      onCheckIn={() => handleCheckIn(appt)}
                      onCancel={() => handleCancel(appt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Upcoming Appointments
                </p>
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <AppointmentRow
                      key={appt.id}
                      appt={appt}
                      busy={busyId === appt.id}
                      onCheckIn={() => handleCheckIn(appt)}
                      onCancel={() => handleCancel(appt)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AppointmentRow({
  appt,
  busy,
  onCheckIn,
  onCancel,
}: {
  appt: Appointment;
  busy: boolean;
  onCheckIn: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-white text-sm truncate">
              {appt.patient_name || "Patient"}
            </p>
            {appt.emergency_type && (
              <span className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase">
                {appt.emergency_type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-purple-300">
              <CalendarDays className="w-3 h-3" /> {formatDate(appt.appointment_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(appt.appointment_time)}
            </span>
            {appt.patient_phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {appt.patient_phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCheckIn}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-extrabold hover:bg-emerald-500/30 transition-all disabled:opacity-50"
        >
          {busy ? <div className="animate-spin w-3.5 h-3.5 border-2 border-emerald-300 border-t-transparent rounded-full" /> : <LogIn className="w-3.5 h-3.5" />}
          Check In
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}
