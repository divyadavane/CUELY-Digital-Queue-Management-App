"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { portalApi } from "@/lib/portal/client";
import { createClient } from "@/lib/supabase";
import { PortalCard, SectionTitle, StatusPill, EmptyState, LoadingBlock } from "@/components/portal/ui";
import { formatDate, formatTime } from "@/lib/i18n/format";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string | null;
  status: string;
  patient_name: string | null;
  emergency_type: string | null;
  queues: { name: string; department: string | null; doctor_name: string | null } | null;
}

export function AppointmentsSection() {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await portalApi<{ appointments: Appointment[] }>("/api/portal/appointments");
      setAppointments(res.appointments);
    } catch (e) {
      setAppointments([]);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const upcoming = (appointments || []).filter(
    (a) => a.status === "scheduled" && a.appointment_date >= today()
  );
  const past = (appointments || []).filter(
    (a) => a.status !== "scheduled" || a.appointment_date < today()
  );

  const cancelAppointment = async (id: string) => {
    setBusy(id);
    try {
      await portalApi(`/api/portal/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel" }),
      });
      toast.success(t("appointments.cancelled"));
      await fetchAppointments();
    } catch (e: any) {
      toast.error(e?.message || t("appointments.failedCancel"));
    } finally {
      setBusy(null);
      setManageId(null);
    }
  };

  if (appointments === null) return <LoadingBlock label={t("appointments.loading")} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle title={t("appointments.title")} subtitle={t("appointments.subtitle")} />
        <button
          onClick={() => setShowBook((v) => !v)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          {t("appointments.book")}
        </button>
      </div>

      {showBook && <BookAppointmentForm onDone={() => { setShowBook(false); fetchAppointments(); }} />}

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-6 h-6" />}
          title={t("appointments.empty")}
          subtitle={t("appointments.emptySub")}
          action={
            <button
              onClick={() => setShowBook(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded-xl transition-all"
            >
              {t("appointments.bookAppointment")}
            </button>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("appointments.upcoming")}</p>
              {upcoming.map((a) => (
                <PortalCard key={a.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">
                          {a.queues?.doctor_name || a.queues?.name || t("appointments.appointment")}
                        </p>
                        <StatusPill status={a.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        {a.queues?.department}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-blue-300 font-bold">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {formatDate(a.appointment_date, i18n.language)}
                        {a.appointment_time && <span>· {formatTime(a.appointment_time, i18n.language)}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setManageId(manageId === a.id ? null : a.id)}
                      className="text-[11px] font-bold text-slate-300 hover:text-white shrink-0"
                    >
                      {t("appointments.manage")}
                    </button>
                  </div>

                  {manageId === a.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                      <RescheduleButton id={a.id} onDone={fetchAppointments} busy={busy} />
                      <button
                        disabled={busy === a.id}
                        onClick={() => cancelAppointment(a.id)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-red-300 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        {busy === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        {t("appointments.cancel")}
                      </button>
                    </div>
                  )}
                </PortalCard>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("appointments.past")}</p>
              {past.map((a) => (
                <PortalCard key={a.id} className="p-5 opacity-80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">
                          {a.queues?.doctor_name || a.queues?.name || t("appointments.appointment")}
                        </p>
                        <StatusPill status={a.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        {formatDate(a.appointment_date, i18n.language)}
                        {a.appointment_time && ` · ${formatTime(a.appointment_time, i18n.language)}`}
                      </p>
                    </div>
                  </div>
                </PortalCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RescheduleButton({ id, onDone, busy }: { id: string; onDone: () => void; busy: string | null }) {
  const { t } = useTranslation();
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  const reschedule = async () => {
    if (!date) {
      toast.error(t("appointments.pickNewDate"));
      return;
    }
    setSaving(true);
    try {
      await portalApi(`/api/portal/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reschedule", date }),
      });
      toast.success(t("appointments.rescheduled"));
      onDone();
    } catch (e: any) {
      toast.error(e?.message || t("appointments.failedReschedule"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="date"
        min={today()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
      />
      <button
        disabled={saving || busy === id}
        onClick={reschedule}
        className="flex items-center gap-1.5 text-[11px] font-bold text-blue-200 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        {t("appointments.reschedule")}
      </button>
    </div>
  );
}

function BookAppointmentForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [queues, setQueues] = useState<any[] | null>(null);
  const [queueId, setQueueId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient()
      .from("queues")
      .select("id, name, department, doctor_name, counter_number")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .then(({ data }: { data: any[] | null; error: any }) => {
        setQueues(data || []);
        if (data && data.length > 0) setQueueId(data[0].id);
      });
  }, []);

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueId || !date) {
      toast.error(t("appointments.pickDoctorDate"));
      return;
    }
    setSaving(true);
    try {
      await portalApi("/api/portal/appointments", {
        method: "POST",
        body: JSON.stringify({ queueId, date, time: time || null }),
      });
      toast.success(t("appointments.booked"));
      setDate("");
      setTime("");
      onDone();
    } catch (e: any) {
      toast.error(e?.message || t("appointments.failedBook"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalCard className="p-5">
      <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <CalendarPlus className="w-4 h-4 text-blue-400" /> {t("appointments.newAppointment")}
      </p>
      <form onSubmit={book} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("appointments.doctorQueue")}</label>
          {queues === null ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : (
            <select
              value={queueId}
              onChange={(e) => setQueueId(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
            >
              {queues.map((q) => (
                <option key={q.id} value={q.id} className="bg-slate-900 text-white">
                  {q.doctor_name || q.name} — {q.department || t("visits.general")}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("appointments.date")}</label>
            <input
              type="date"
              required
              min={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("appointments.timeOptional")}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || queues === null}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {t("appointments.confirmBooking")}
        </button>
      </form>
    </PortalCard>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
