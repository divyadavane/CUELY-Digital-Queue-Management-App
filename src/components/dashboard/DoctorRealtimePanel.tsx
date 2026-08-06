"use client";

// Doctor-side focused panel: patient-in-consultation, up-next strip,
// live consult timer + pacing, one-tap actions, today's schedule strip
// and end-of-day summary. Uses createClient + realtime postgres_changes.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { calculateUrgency } from "@/lib/urgency";
import {
  Stethoscope,
  Clock,
  Users,
  Play,
  CheckCircle2,
  AlertTriangle,
  HandHelping,
  Mic,
  CalendarDays,
  CalendarOff,
  Timer,
  Hourglass,
  UserCheck,
  Flag,
  PenLine,
} from "lucide-react";
import toast from "react-hot-toast";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: {
    results: ArrayLike<{ [index: number]: { transcript: string } }>;
  }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

interface DoctorRealtimePanelProps {
  queueId: string;
  doctorName: string;
}

interface DaySummary {
  doctor_name: string | null;
  department: string | null;
  avg_consult_mins: number;
  day_name: string;
  schedule: {
    has_shifts_today: boolean;
    shifts: { start: string; end: string; duration: number }[];
    blocked: { title: string; block_type: string; start_time: string | null; end_time: string | null }[];
    open_capacity: number;
  };
  eod: {
    served_today: number;
    avg_consult_sec: number;
    follow_ups: { date: string; diagnosis: string | null; notes: string | null }[];
    tomorrow_first: { name: string | null; phone: string | null; time: string } | null;
  };
}

function formatDuration(totalSec: number): string {
  const total = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatOver(totalSec: number, targetMins: number): string {
  const over = Math.max(0, Math.floor(totalSec / 60 - targetMins));
  return `+${over}m`;
}

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  tone: "blue" | "emerald" | "amber" | "red" | "zinc";
}

function Chip({ icon, label, tone }: ChipProps) {
  const tones: Record<ChipProps["tone"], string> = {
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    red: "bg-red-500/15 text-red-300 border-red-500/25",
    zinc: "bg-white/5 text-slate-300 border-white/10",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${tones[tone]}`}>
      {icon}
      {label}
    </span>
  );
}

function urgencyLabel(t: Ticket): string {
  const u = calculateUrgency(t);
  return `${u.label} · score ${u.score}`;
}

export function DoctorRealtimePanel({ queueId, doctorName }: DoctorRealtimePanelProps) {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteTicketId, setNoteTicketId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [dictating, setDictating] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const loadQueue = useCallback(async () => {
    const { data } = await supabase.from("queues").select("*").eq("id", queueId).maybeSingle();
    if (data) setQueue(data);
  }, [queueId, supabase]);

  const loadTickets = useCallback(async () => {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("queue_id", queueId)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("joined_at", { ascending: true });
    if (data) setTickets(data);
  }, [queueId, supabase]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/doctor/summary?queueId=${encodeURIComponent(queueId)}`);
      if (res.ok) setSummary(await res.json());
    } catch {
      /* non-fatal */
    }
  }, [queueId]);

  useEffect(() => {
    loadQueue();
    loadTickets();
    loadSummary();
  }, [loadQueue, loadTickets, loadSummary]);

  useEffect(() => {
    const tChan = supabase
      .channel(`synco-doc-tickets-${queueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `queue_id=eq.${queueId}` },
        () => loadTickets()
      )
      .subscribe();
    const qChan = supabase
      .channel(`synco-doc-queue-${queueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues", filter: `id=eq.${queueId}` },
        (payload: { new?: Queue }) => {
          if (payload.new) setQueue(payload.new);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(tChan);
      supabase.removeChannel(qChan);
    };
  }, [queueId, supabase, loadTickets]);

  const inConsult = useMemo(() => tickets.find((t) => t.status === "called"), [tickets]);
  const waiting = useMemo(() => tickets.filter((t) => t.status === "waiting"), [tickets]);
  const upNext = waiting.slice(0, 3);
  const targetMins = queue?.avg_consult_mins ?? 10;

  // ---- consult timer ----
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!inConsult?.consult_started_at) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [inConsult?.consult_started_at]);

  const elapsedSec = inConsult?.consult_started_at
    ? Math.floor((now - new Date(inConsult.consult_started_at).getTime()) / 1000)
    : 0;
  const pacingPct = targetMins > 0 ? Math.min(100, (elapsedSec / (targetMins * 60)) * 100) : 0;
  const pacingOver = elapsedSec > targetMins * 60;

  // ---- actions ----
  const runAction = useCallback(
    async (action: string, tick: string, payload: Record<string, unknown> = {}) => {
      setBusy(tick);
      try {
        const res = await fetch("/api/dashboard/doctor/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, queueId, ...payload }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Action failed");
        await Promise.all([loadTickets(), loadQueue(), loadSummary()]);
        return json;
      } finally {
        setBusy(null);
      }
    },
    [queueId, loadTickets, loadQueue, loadSummary]
  );

  const startConsult = (ticketId: string) =>
    toast.promise(runAction("start_consult", "start", { ticketId }), {
      loading: "Starting consult…",
      success: "Consult started",
      error: "Failed to start consult",
    });

  const completeConsult = (ticketId: string) =>
    toast.promise(runAction("complete_consult", "complete", { ticketId }), {
      loading: "Completing consult…",
      success: "Consult complete — next patient",
      error: "Failed to complete consult",
    });

  const requestAssistance = () =>
    toast.promise(runAction("request_assistance", "assist"), {
      loading: "Notifying front desk…",
      success: "Front-desk assistance requested",
      error: "Failed to request assistance",
    });

  const clearAssistance = () => runAction("clear_assistance", "clearAssist");

  const saveNote = async (ticketId: string) => {
    if (!noteText.trim() || !ticketId) return;
    setBusy("note");
    const { error } = await supabase
      .from("tickets")
      .update({ clinical_note: noteText.trim() })
      .eq("id", ticketId);
    if (error) toast.error(error.message);
    else toast.success("Note saved to patient record");
    setNoteTicketId(null);
    setNoteText("");
    setBusy(null);
    loadTickets();
  };

  // ---- speech dictation ----
  const toggleDictation = () => {
    const SR = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition || (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice-to-text not supported in this browser");
      return;
    }
    if (dictating) {
      recRef.current?.stop?.();
      setDictating(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setNoteText(text);
    };
    rec.onend = () => setDictating(false);
    rec.onerror = () => setDictating(false);
    recRef.current = rec;
    setDictating(true);
    try {
      rec.start();
    } catch {
      setDictating(false);
    }
  };

  const assistanceRequested = !!queue?.assistance_requested_at;

  return (
    <div className="space-y-6">
      {/* ===== Live mini-KPI strip ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">In consult</p>
            <p className="text-sm font-black text-white truncate">{inConsult ? `#${inConsult.token_number}` : "—"}</p>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Waiting</p>
            <p className="text-sm font-black text-white">{waiting.length}</p>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Hourglass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Slots open</p>
            <p className="text-sm font-black text-white">{summary?.schedule.open_capacity ?? "—"}</p>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Served today</p>
            <p className="text-sm font-black text-white">{summary?.eod.served_today ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* ===== Patient in consultation ===== */}
      {inConsult ? (
        <div className="bg-slate-900/80 border border-blue-500/30 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                #{inConsult.token_number}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-blue-300 mb-0.5">
                  <Timer className="inline w-3 h-3 mr-1" /> In consultation
                </p>
                <h2 className="text-xl font-black text-white">{inConsult.customer_name || "Patient"}</h2>
                <p className="text-xs text-slate-400">{inConsult.customer_phone || "Walk-in"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-black font-mono ${pacingOver ? "text-red-400" : "text-white"}`}>
                {formatDuration(elapsedSec)}
              </div>
              <button
                onClick={() => completeConsult(inConsult.id)}
                disabled={busy === "complete"}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete consult
              </button>
            </div>
          </div>

          {/* pacing indicator */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> Pacing vs {targetMins}-min target
              </span>
              <span className={pacingOver ? "text-red-400 font-bold" : "text-slate-300"}>
                {pacingOver ? `Over by ${formatOver(elapsedSec, targetMins)}` : "On track"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${pacingOver ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${pacingPct}%` }}
              />
            </div>
          </div>

          {/* patient detail chips */}
          <div className="px-6 pb-5 flex flex-wrap gap-2">
            <Chip icon={<Flag className="w-3 h-3" />} label={urgencyLabel(inConsult)} tone="blue" />
            {inConsult.insurance_verified ? (
              <Chip icon={<UserCheck className="w-3 h-3" />} label="Insurance verified" tone="emerald" />
            ) : (
              <Chip icon={<AlertTriangle className="w-3 h-3" />} label="No insurance on file" tone="amber" />
            )}
            {inConsult.visit_reason && <Chip icon={<PenLine className="w-3 h-3" />} label={inConsult.visit_reason} tone="zinc" />}
            {inConsult.urgency_tag && <Chip icon={<Flag className="w-3 h-3" />} label={inConsult.urgency_tag} tone="red" />}
          </div>

          {/* one-tap actions */}
          <div className="px-6 pb-6 flex flex-wrap gap-2">
            <button
              onClick={() => { setNoteTicketId(inConsult.id); setNoteText(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200"
            >
              <Mic className="w-3.5 h-3.5" /> Note / Dictation
            </button>
            <button
              onClick={requestAssistance}
              disabled={busy === "assist"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${
                assistanceRequested
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
              }`}
            >
              <HandHelping className="w-3.5 h-3.5" />
              {assistanceRequested ? "Assistance requested" : "Request front-desk help"}
            </button>
            <button
              onClick={() => startConsult(inConsult.id)}
              disabled={busy === "start"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200"
              title="Restart consult timer"
            >
              <Play className="w-3.5 h-3.5" /> Restart timer
            </button>
          </div>

          {/* quick note editor */}
          {noteTicketId === inConsult.id && (
            <div className="px-6 pb-6">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Mic className={`w-4 h-4 ${dictating ? "text-red-400 animate-pulse" : "text-slate-400"}`} />
                    Quick clinical note{dictating ? " — listening…" : ""}
                  </p>
                  <button
                    onClick={toggleDictation}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25"
                  >
                    <Mic className="w-3 h-3 inline mr-1" />
                    {dictating ? "Stop" : "Dictate"}
                  </button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Symptom, differential, plan… saved straight to the patient's record."
                  rows={3}
                  className="w-full bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 resize-none"
                />
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setNoteTicketId(null)} className="text-[11px] text-slate-400 hover:text-white">
                    Cancel
                  </button>
                  <button
                    onClick={() => saveNote(inConsult.id)}
                    disabled={busy === "note" || !noteText.trim()}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Save note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 text-center text-slate-400">
          <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <p className="font-bold text-white">No patient in consultation</p>
          <p className="text-xs">Call a patient to start your consult timer and pacing view.</p>
        </div>
      )}

      {/* ===== Up-next preview strip ===== */}
      {upNext.length > 0 && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 shadow-xl">
          <p className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Up next in this queue
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upNext.map((t, i) => {
              const u = calculateUrgency(t);
              return (
                <div key={t.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400">#{t.token_number}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${u.badgeClass}`}>
                      {u.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">{t.customer_name || "Patient"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => startConsult(t.id)}
                      disabled={busy === "start"}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[11px] font-bold"
                    >
                      <Play className="w-3 h-3" /> Pull forward
                    </button>
                    {i === 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" /> next
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Today's schedule strip + EOD ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 shadow-xl lg:col-span-2">
          <p className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" /> Today ({summary?.day_name || ""})
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Working hours</span>
              <span className="font-bold text-white">
                {summary?.schedule.has_shifts_today
                  ? summary.schedule.shifts.map((s) => `${s.start}–${s.end}`).join(", ")
                  : "No shifts today"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CalendarOff className="w-3.5 h-3.5 text-red-400" /> Leave / blocks
              </span>
              <span className="font-bold text-white">
                {summary?.schedule.blocked.length ? summary.schedule.blocked.map((b) => b.title).join(", ") : "None"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Remaining slots</span>
              <span className="font-bold text-emerald-400">{summary?.schedule.open_capacity ?? "—"}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 shadow-xl">
          <p className="text-xs font-bold uppercase text-slate-400 mb-3">End of day</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Avg consult</span>
              <span className="font-bold text-white">
                {summary?.eod.avg_consult_sec ? `${Math.floor(summary.eod.avg_consult_sec / 60)}m` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pending follow-ups</span>
              <span className="font-bold text-amber-300">{summary?.eod.follow_ups.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tomorrow first</span>
              <span className="font-bold text-white">
                {summary?.eod.tomorrow_first
                  ? `${summary.eod.tomorrow_first.name || "Appt"} @ ${summary.eod.tomorrow_first.time}`
                  : "No appointments"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* pending action: intro explaining timer auto-starts */}
      <div className="text-[11px] text-slate-500">
        {doctorName} — consult timer tracks pacing against the {targetMins}-minute target. Marking a patient{" "}
        <span className="font-bold text-white">called</span>
        &nbsp;does not require a manual start; use{" "}
        <span className="font-bold text-white">Restart timer</span> to begin after a long intake.
      </div>
    </div>
  );
}

