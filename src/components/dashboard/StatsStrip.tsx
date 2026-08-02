"use client";

import { Users, Clock, Timer, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Database } from "@/types/database";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface StatsStripProps {
  tickets: Ticket[];
  avgWaitSeconds: number;
  totalServedToday: number;
  noShowRate?: number;
}

export function StatsStrip({
  tickets,
  avgWaitSeconds,
  totalServedToday,
  noShowRate = 0,
}: StatsStripProps) {
  const currentlyWaiting = tickets.filter((t) => t.status === "waiting").length;

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {/* Stat 1: Waiting */}
      <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/40 hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Currently Waiting</span>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl lg:text-4xl font-extrabold font-sans text-foreground">{currentlyWaiting}</span>
          <span className="text-xs font-semibold text-blue-400 flex items-center gap-0.5 bg-blue-500/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Live
          </span>
        </div>
      </div>

      {/* Stat 2: Served */}
      <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-green-500/40 hover:shadow-green-500/10 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Served Today</span>
          <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl lg:text-4xl font-extrabold font-sans text-foreground">{totalServedToday}</span>
          <span className="text-xs font-bold text-green-400 flex items-center gap-0.5 bg-green-500/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" /> +14%
          </span>
        </div>
      </div>

      {/* Stat 3: Est Wait Time */}
      <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/40 hover:shadow-purple-500/10 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Est. Wait Time</span>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Timer className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl lg:text-4xl font-extrabold font-sans text-foreground">
            {formatWaitTime(avgWaitSeconds)}
          </span>
          <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
            Rolling avg
          </span>
        </div>
      </div>

      {/* Stat 4: No Show Rate */}
      <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-red-500/40 hover:shadow-red-500/10 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">No Show Rate</span>
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl lg:text-4xl font-extrabold font-sans text-foreground">{noShowRate}%</span>
          <span className="text-xs font-bold text-slate-400 flex items-center gap-0.5 bg-slate-500/10 px-2 py-0.5 rounded-full">
            <TrendingDown className="w-3.5 h-3.5 text-green-400" /> -2%
          </span>
        </div>
      </div>
    </div>
  );
}
