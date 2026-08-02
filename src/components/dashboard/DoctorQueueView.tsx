"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { TicketRow } from "./TicketRow";
import { TransferTicketModal } from "./TransferTicketModal";
import {
  Stethoscope,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Play,
  Sliders,
  Building2,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";
import toast from "react-hot-toast";

type Queue = Database["public"]["Tables"]["queues"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface DoctorInfo {
  id: string;
  name: string;
  department: string;
  queueId: string;
  consultDurationMins: number;
  isPaused: boolean;
}

interface DoctorQueueViewProps {
  queues: Queue[];
}

export function DoctorQueueView({ queues }: DoctorQueueViewProps) {
  // Build doctor info from queues instead of hardcoding
  const doctorsInitial = React.useMemo(() => {
    if (!queues || queues.length === 0) return [];
    return queues.map((q) => ({
      id: q.id,
      name: q.doctor_name || q.name,
      department: q.department || "General",
      queueId: q.id,
      consultDurationMins: 10,
      isPaused: q.status === "on break" || q.is_paused,
    }));
  }, [queues]);
  const [doctors, setDoctors] = useState<DoctorInfo[]>(doctorsInitial);

  useEffect(() => {
    setDoctors(doctorsInitial);
  }, [doctorsInitial]);

  const [activeDoctorId, setActiveDoctorId] = useState<string>("doc-1");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"arrival" | "urgency">("urgency");

  const activeDoctor = doctors.find((d) => d.id === activeDoctorId) || doctors[0];
  const supabase = createClient();

  // Fetch active doctor's queue tickets
  const fetchDoctorQueue = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .eq("queue_id", activeDoctor.queueId)
        .in("status", ["waiting", "called"])
        .order("priority", { ascending: false })
        .order("joined_at", { ascending: true });

      if (data) {
        setTickets(data);
      }
    } catch (e) {
      console.error("Failed to fetch doctor queue tickets:", e);
    } finally {
      setLoading(false);
    }
  }, [activeDoctor.queueId, supabase]);

  useEffect(() => {
    fetchDoctorQueue();

    // Subscribe to realtime updates for doctor's queue
    const channel = supabase
      .channel(`public:tickets:doctor:${activeDoctor.queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `queue_id=eq.${activeDoctor.queueId}`,
        },
        () => {
          fetchDoctorQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDoctorQueue, activeDoctor.queueId, supabase]);

  // Toggle Doctor Queue Pause / Break
  const toggleQueuePause = () => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === activeDoctor.id ? { ...d, isPaused: !d.isPaused } : d))
    );
    toast.success(
      activeDoctor.isPaused
        ? `${activeDoctor.name}'s Queue is now ACTIVE!`
        : `${activeDoctor.name} is on BREAK. Queue paused.`
    );
  };

  // Update consult duration
  const handleConsultDurationChange = (mins: number) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === activeDoctor.id ? { ...d, consultDurationMins: mins } : d))
    );
  };

  const currentlyWaiting = tickets.filter((t) => t.status === "waiting").length;
  const estWaitMins = currentlyWaiting * activeDoctor.consultDurationMins;

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header & Doctor Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-sans text-white">
              Per-Doctor Live Queue Dashboard
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Manage doctor-specific queues, consult durations, breaks, and patient transfers
            </p>
          </div>
        </div>

        {/* Doctor Switcher Dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 border border-white/15 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg">
            <Stethoscope className="w-4 h-4 text-accent" />
            <select
              value={activeDoctorId}
              onChange={(e) => setActiveDoctorId(e.target.value)}
              className="bg-transparent text-white font-extrabold text-sm focus:outline-none cursor-pointer"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-slate-900 text-white font-bold">
                  {doc.name} ({doc.department})
                </option>
              ))}
            </select>
          </div>

          {/* Queue Break / Pause Toggle Button */}
          <button
            onClick={toggleQueuePause}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-lg transition-all border ${
              activeDoctor.isPaused
                ? "bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                : "bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30"
            }`}
          >
            {activeDoctor.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {activeDoctor.isPaused ? "Resume Queue" : "Doctor Break / Pause"}
          </button>
        </div>
      </div>

      {/* Paused Queue Banner Warning */}
      {activeDoctor.isPaused && (
        <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-300 font-bold text-sm flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              {activeDoctor.name} is currently ON BREAK. Queue is paused and new tokens will wait.
            </span>
          </div>
          <button
            onClick={toggleQueuePause}
            className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black hover:brightness-110"
          >
            Resume Now
          </button>
        </div>
      )}

      {/* Scoped Doctor Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-slate-400">Currently Waiting</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-4xl font-extrabold text-white">{currentlyWaiting}</div>
          <span className="text-xs font-medium text-blue-400 mt-1 block">In {activeDoctor.name}&apos;s line</span>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-slate-400">Est. Queue Wait</span>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-4xl font-extrabold text-white">
            {estWaitMins}<span className="text-xl text-slate-400 font-normal">m</span>
          </div>
          <span className="text-xs font-medium text-purple-400 mt-1 block">Based on {activeDoctor.consultDurationMins}m / patient</span>
        </div>

        {/* Doctor Consult Duration Setting Slider */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Avg Consult Duration</span>
            <Sliders className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{activeDoctor.consultDurationMins} mins</div>
          <input
            type="range"
            min="3"
            max="30"
            value={activeDoctor.consultDurationMins}
            onChange={(e) => handleConsultDurationChange(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-slate-400">Doctor Status</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {activeDoctor.isPaused ? "ON BREAK" : "AVAILABLE"}
          </div>
          <span className="text-xs font-medium text-slate-400 mt-1 block">{activeDoctor.department}</span>
        </div>
      </div>

      {/* Doctor's Scoped Queue List */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4 bg-white/5">
          <div>
            <h2 className="font-bold text-lg text-white font-sans">{activeDoctor.name}&apos;s Live Queue</h2>
            <p className="text-xs text-slate-400">Scoped patient arrivals for {activeDoctor.department}</p>
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setSortBy("urgency")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === "urgency" ? "bg-accent text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Priority Order
            </button>
            <button
              onClick={() => setSortBy("arrival")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === "arrival" ? "bg-accent text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Arrival Time
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="p-6 space-y-4">
          {tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Queue is clear!</h4>
              <p className="text-xs">No patients currently waiting for {activeDoctor.name}.</p>
            </div>
          ) : (
            tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} queues={queues} adminRole="owner" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
