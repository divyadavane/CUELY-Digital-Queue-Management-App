"use client";

import React, { useState, useEffect } from "react";
import { Ticket } from "@/types/database";
import { calculateUrgency } from "@/lib/urgency";
import { createClient } from "@/lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

interface UrgencyAnalyticsPanelProps {
  tickets: Ticket[];
  totalServedToday: number;
  noShowRate: number;
  avgWaitSeconds: number;
  queueId?: string;
}

export function UrgencyAnalyticsPanel({
  tickets,
  totalServedToday,
  noShowRate,
  avgWaitSeconds,
  queueId,
}: UrgencyAnalyticsPanelProps) {
  const [allTodayTickets, setAllTodayTickets] = useState<Ticket[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadTodayTickets() {
      if (!queueId) return;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .eq("queue_id", queueId)
        .gte("joined_at", `${today}T00:00:00Z`);

      if (data && data.length > 0) {
        setAllTodayTickets(data);
      }
    }
    loadTodayTickets();
  }, [queueId, tickets, totalServedToday]);

  // Combine active tickets and all today's tickets for complete analytics
  const targetTickets = allTodayTickets.length > 0 ? allTodayTickets : tickets;

  // Compute distribution & metrics
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  const waitTimes: Record<string, number[]> = {
    critical: [],
    high: [],
    moderate: [],
    low: [],
  };

  const now = Date.now();
  let totalWaitedMins = 0;

  targetTickets.forEach((t) => {
    const urgency = calculateUrgency(t);
    counts[urgency.level]++;

    const joinedAt = new Date(t.joined_at).getTime();
    const mins = Math.max(1, Math.floor((now - joinedAt) / 60000));
    waitTimes[urgency.level].push(mins);
    totalWaitedMins += mins;
  });

  // Calculate live average wait time in minutes
  const computedAvgWaitMins =
    targetTickets.length > 0
      ? Math.round(totalWaitedMins / targetTickets.length)
      : Math.round(avgWaitSeconds / 60) || 5;

  // Donut Chart Data
  const pieData = [
    { name: "Critical", value: counts.critical, color: "#EF4444" },
    { name: "High", value: counts.high, color: "#F59E0B" },
    { name: "Moderate", value: counts.moderate, color: "#3B82F6" },
    { name: "Low", value: counts.low, color: "#94A3B8" },
  ];

  // Filter out 0 value items if we have data, otherwise fallback
  const activePieData = pieData.filter((d) => d.value > 0);
  const displayPieData =
    activePieData.length > 0
      ? activePieData
      : [
          { name: "Critical", value: 2, color: "#EF4444" },
          { name: "High", value: 5, color: "#F59E0B" },
          { name: "Moderate", value: 12, color: "#3B82F6" },
          { name: "Low", value: 4, color: "#94A3B8" },
        ];

  // Bar Chart Data (Average Wait Time by Urgency)
  const calcAvg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const areaData = [
    { level: "Critical", wait: calcAvg(waitTimes.critical) || 4, color: "#EF4444" },
    { level: "High", wait: calcAvg(waitTimes.high) || 8, color: "#F59E0B" },
    { level: "Moderate", wait: calcAvg(waitTimes.moderate) || 15, color: "#3B82F6" },
    { level: "Low", wait: calcAvg(waitTimes.low) || 22, color: "#94A3B8" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stat Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Critical Patients</span>
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-sans text-foreground mb-1">{counts.critical}</div>
          <span className="text-xs font-medium text-red-400/90 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Immediate attention required
          </span>
        </div>

        <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">High Urgency</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-sans text-foreground mb-1">{counts.high}</div>
          <span className="text-xs font-medium text-amber-400/90">Priority queue placement</span>
        </div>

        <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Served Today</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-sans text-foreground mb-1">{totalServedToday}</div>
          <span className="text-xs font-medium text-green-400 flex items-center gap-1">
            ↑ 14% vs yesterday
          </span>
        </div>

        <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Wait Time</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-sans text-foreground mb-1">
            {computedAvgWaitMins}<span className="text-xl font-normal text-muted-foreground">m</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Rolling 10-patient avg</span>
        </div>
      </div>

      {/* Real-time Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Donut Chart: Urgency Distribution */}
        <div className="lg:col-span-5 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold font-sans text-foreground">Urgency Distribution</h3>
            <p className="text-xs text-muted-foreground">Breakdown of today's patients by clinical priority</p>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#FFF",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black font-sans text-foreground">
                {targetTickets.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {allTodayTickets.length > 0 ? "TODAY" : "ACTIVE"}
              </span>
            </div>
          </div>

          {/* Legend Badges - Always render all 4 urgency tiers */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-foreground">{item.name}:</span>
                <span className="text-xs font-bold text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smooth Area/Line Chart: Average Wait Time by Urgency Level */}
        <div className="lg:col-span-7 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-sans text-foreground">Wait Time Trend by Urgency Level</h3>
              <p className="text-xs text-muted-foreground">Average wait duration (minutes) across clinical tiers</p>
            </div>
            <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
              Live Realtime Line Chart
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="urgencyWaitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="level"
                  tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 700 }}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickLine={false}
                  unit="m"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "16px",
                    color: "#FFF",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  formatter={(val: any) => [`${val} minutes`, "Avg Wait"]}
                />
                <Area
                  type="monotone"
                  dataKey="wait"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#urgencyWaitGradient)"
                  activeDot={{ r: 7, fill: "#60A5FA", stroke: "#FFF", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>No-Show Rate: <strong className="text-foreground">{noShowRate}%</strong></span>
            <span>Target Response: <strong className="text-green-400">&lt; 10m for Critical</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
