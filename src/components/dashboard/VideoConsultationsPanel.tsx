"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, VideoOff, Loader2, Phone } from "lucide-react";

interface DoctorConsultation {
  id: string;
  status: string;
  scheduled_start: string;
  expires_at: string;
  patient_name: string | null;
  patient_phone: string;
  doctor_name: string | null;
  queue_name: string | null;
  bill: { id: string; amount: number; status: "paid" | "pending" } | null;
}

const ACTIVE = new Set(["scheduled", "ready", "in_call"]);
const JOINABLE = new Set(["scheduled", "ready", "in_call"]);

function isExpired(c: { expires_at: string }): boolean {
  return new Date(c.expires_at).getTime() < Date.now();
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  ready: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  in_call: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  completed: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  cancelled: "bg-red-500/15 border-red-500/30 text-red-300",
  missed: "bg-red-500/15 border-red-500/30 text-red-300",
  expired: "bg-red-500/15 border-red-500/30 text-red-300",
};

function StatusBadge({ status }: { status: string }) {
  const label = status.replace("_", " ").toUpperCase();
  return (
    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[status] || "bg-slate-500/15 border-slate-500/30 text-slate-300"}`}>
      {label}
    </span>
  );
}

export function VideoConsultationsPanel({ queueId }: { queueId: string }) {
  const router = useRouter();
  const [consultations, setConsultations] = useState<DoctorConsultation[] | null>(null);

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/consultations?queueId=${encodeURIComponent(queueId)}`);
      if (!res.ok) {
        setConsultations([]);
        return;
      }
      const { consultations } = await res.json();
      setConsultations(consultations || []);
    } catch {
      setConsultations([]);
    }
  }, [queueId]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const upcoming = (consultations || []).filter((c) => ACTIVE.has(c.status) && !isExpired(c));
  const past = (consultations || []).filter((c) => !ACTIVE.has(c.status) || isExpired(c));

  if (consultations === null) {
    return (
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <p className="text-xs text-slate-400">Loading video consultations...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4 bg-white/5">
        <div>
          <h2 className="font-bold text-lg text-white font-sans flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            Video Consultations
          </h2>
          <p className="text-xs text-slate-400">Online visits booked by patients</p>
        </div>
        {upcoming.length > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
            {upcoming.length} pending
          </span>
        )}
      </div>

      <div className="p-6 space-y-4">
        {consultations.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <VideoOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">No video consultations</h4>
            <p className="text-xs">Patients will see you here when they book an online visit.</p>
          </div>
        ) : (
          <>
            {upcoming.map((c) => (
              <div key={c.id} className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">
                      {c.patient_name || c.patient_phone}
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">{fmt(c.scheduled_start)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.bill?.status === "paid" ? (
                    <button
                      onClick={() => router.push(`/dashboard/doctor/video/${c.id}`)}
                      disabled={!JOINABLE.has(c.status)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Phone className="w-4 h-4" />
                      Join Call
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl">
                      ₹{Number(c.bill?.amount || 0)}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {past.length > 0 && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pt-2">Past</p>
                {past.slice(0, 8).map((c) => (
                  <div key={c.id} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 opacity-70">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {c.patient_name || c.patient_phone}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">{fmt(c.scheduled_start)}</p>
                    </div>
                    <StatusBadge status={isExpired(c) ? "expired" : c.status} />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
