"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { QueueGraphItem } from "@/hooks/useQueueGraphData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { Activity, Sparkles, Clock } from "lucide-react";

interface LiveQueueGraphProps {
  items: QueueGraphItem[];
}

export function LiveQueueGraph({ items }: LiveQueueGraphProps) {
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return (
      <div className="w-full bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-xl my-6">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">{t("graph.clear")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("graph.noPatients")}</p>
        </div>
      </div>
    );
  }

  // Format data for recharts
  const chartData = items.map((item) => ({
    token: `#${item.token_number}`,
    tokenNum: item.token_number,
    waited: item.minutes_waited,
    status: item.status,
    isSelf: item.isSelf,
    emergency: item.emergency_type || "routine",
  }));

  const selfItem = chartData.find((d) => d.isSelf);

  return (
    <div className="w-full bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent animate-pulse" />
            <h3 className="font-bold text-foreground text-base md:text-lg font-sans">{t("graph.title")}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t("graph.subtitle")}</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-muted-foreground">{t("graph.legend")}</span>
          </div>
          {selfItem && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-3 h-3" />
              <span>{t("graph.yourToken", { n: selfItem.tokenNum })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Smooth Line/Area Chart */}
      <div className="h-60 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="queueLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="token"
              tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              tickLine={false}
              unit="m"
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-white/20 p-3 rounded-2xl shadow-2xl text-xs text-white backdrop-blur-md">
                      <div className="flex items-center justify-between gap-4 font-bold text-accent mb-1">
                        <span>{t("graph.tokenX", { n: data.token })}</span>
                        {data.isSelf && <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 rounded">{t("graph.you")}</span>}
                      </div>
                      <p className="text-slate-300 font-semibold">{t("graph.waited", { n: data.waited })}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{t("graph.statusLine", { status: data.status, emergency: data.emergency })}</p>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="waited"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#queueLineGradient)"
              activeDot={{ r: 6, fill: "#60A5FA", stroke: "#FFF", strokeWidth: 2 }}
            />

            {/* Highlight Dot for Self */}
            {selfItem && (
              <ReferenceDot
                x={selfItem.token}
                y={selfItem.waited}
                r={8}
                fill="#F59E0B"
                stroke="#FFF"
                strokeWidth={3}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
