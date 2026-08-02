"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface TodayStats {
  servedCount: number;
  waitingCount: number;
  noShowCount: number;
  avgWaitSeconds: number;
}

export function useStats(queueId: string | undefined) {
  const [stats, setStats] = useState<TodayStats>({
    servedCount: 0,
    waitingCount: 0,
    noShowCount: 0,
    avgWaitSeconds: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    if (!queueId) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Fetch all of today's tickets for this queue
    const { data: ticketsData } = await supabase
      .from("tickets")
      .select("status")
      .eq("queue_id", queueId)
      .gte("joined_at", todayISO);

    // Fetch today's serving stats for average duration
    const { data: statsData } = await supabase
      .from("serving_stats")
      .select("duration_seconds")
      .eq("queue_id", queueId)
      .gte("recorded_at", todayISO);

    if (ticketsData) {
      const served = ticketsData.filter((t: { status: string }) => t.status === "served").length;
      const waiting = ticketsData.filter((t: { status: string }) => t.status === "waiting").length;
      const noShow = ticketsData.filter((t: { status: string }) => t.status === "no_show").length;

      let avgWait = 0;
      if (statsData && statsData.length > 0) {
        const total = statsData.reduce((sum: number, s: { duration_seconds: number }) => sum + s.duration_seconds, 0);
        avgWait = Math.round(total / statsData.length);
      }

      setStats({
        servedCount: served,
        waitingCount: waiting,
        noShowCount: noShow,
        avgWaitSeconds: avgWait,
      });
    }

    setLoading(false);
  }, [queueId, supabase]);

  useEffect(() => {
    fetchStats();
    // Re-fetch stats every 30 seconds (piggybacks with Realtime for tickets)
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
