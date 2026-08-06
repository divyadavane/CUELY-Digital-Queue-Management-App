"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { portalApi } from "@/lib/portal/client";

const UNREAD_CHANNEL = "chat-unread";

interface UnreadOptions {
  role: "patient" | "doctor";
  queueId?: string;
  pollMs?: number;
}

/**
 * Total unread chat messages across a role's conversations.
 * - Refreshes instantly when a chat message is persisted (global broadcast ping).
 * - Polls as a fallback in case realtime drops.
 * - `refresh()` is exposed so callers can resync after reading a thread.
 */
export function useUnreadChatCount({ role, queueId, pollMs = 30000 }: UnreadOptions) {
  const [unread, setUnread] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      let total = 0;
      if (role === "patient") {
        const res = await portalApi<{ conversations?: { unread_count?: number }[] }>(
          "/api/portal/messages"
        );
        total = (res.conversations || []).reduce((s, c) => s + (c.unread_count || 0), 0);
      } else {
        if (!queueId) return;
        const res = await fetch(
          `/api/dashboard/messages?queueId=${encodeURIComponent(queueId)}`
        );
        const body = await res.json().catch(() => ({}));
        total = (body.conversations || []).reduce(
          (s: number, c: { unread_count?: number }) => s + (c.unread_count || 0),
          0
        );
      }
      setUnread(total);
    } catch {
      /* ignore */
    }
  }, [role, queueId]);

  // Live ping: any persisted chat message triggers a resync.
  useEffect(() => {
    const supabase = createClient();
    const channel: RealtimeChannel = supabase.channel(UNREAD_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "unread" }, () => {
        fetchCount();
      })
      .subscribe();
    return () => {
      channel.unsubscribe().catch(() => {});
    };
  }, [fetchCount]);

  // Fallback polling.
  useEffect(() => {
    fetchCount();
    timerRef.current = setInterval(fetchCount, pollMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchCount, pollMs]);

  return { unread, refresh: fetchCount };
}
