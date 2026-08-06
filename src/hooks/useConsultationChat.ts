"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getPortalToken, portalApi } from "@/lib/portal/client";
import type { ChatMessage } from "@/lib/consultationChat";

export type ChatRole = "doctor" | "patient";

interface UseChatOptions {
  consultationId: string;
  role: ChatRole;
  senderName: string;
}

const REALTIME_EVENT = "chat_message";

export function useConsultationChat({ consultationId, role, senderName }: UseChatOptions) {
  const supabaseRef = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const idsRef = useRef(new Set<string>());

  const endpoint = role === "doctor" ? "dashboard" : "portal";
  const base = `/api/${endpoint}/consultations/${consultationId}/chat`;

  // ---- generic API helper (portal uses bearer token, dashboard uses cookies) --
  const call = useCallback(
    async <T = any>(path: string, init?: RequestInit): Promise<T> => {
      if (role === "patient") {
        return portalApi<T>(path, init);
      }
      const res = await fetch(path, init);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Request failed");
      return body as T;
    },
    [role]
  );

  const acceptRow = useCallback((row: ChatMessage | undefined | null) => {
    if (!row || !row.id) return;
    if (idsRef.current.has(row.id)) return;
    idsRef.current.add(row.id);
    setMessages((prev) => [...prev, row]);
  }, []);

  // Push a freshly saved message to the other participant over realtime.
  const broadcastRow = useCallback((row: ChatMessage | undefined | null) => {
    if (!row?.id) return;
    try {
      channelRef.current?.send({ type: "broadcast", event: REALTIME_EVENT, payload: { row } });
    } catch {
      /* ignore */
    }
  }, []);

  // ---- load history on mount / consultation change ----
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    idsRef.current = new Set<string>();
    call<{ messages: ChatMessage[] }>(base)
      .then((res) => {
        if (cancelled) return;
        res?.messages?.forEach((m) => {
          if (m.id) idsRef.current.add(m.id);
        });
        setMessages(res?.messages || []);
      })
      .catch((e) => !cancelled && setError(e?.message || "Failed to load chat"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  // ---- realtime broadcast channel for live messages ----
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel: RealtimeChannel = supabase.channel(`chat:${consultationId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: REALTIME_EVENT }, (payload: any) => {
        acceptRow(payload?.payload?.row as ChatMessage);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      channel.unsubscribe().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, acceptRow]);

  // ---- send a text message ----
  const sendMessage = useCallback(
    async (text: string): Promise<ChatMessage | null> => {
      const clean = text.trim();
      if (!clean) return null;
      try {
        const res = await call<{ message: ChatMessage }>(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: clean }),
        });
        acceptRow(res?.message);
        return res?.message || null;
      } catch (e: any) {
        setError(e?.message || "Failed to send message");
        throw e;
      }
    },
    [call, base, acceptRow]
  );

  // ---- send a file / attachment message ----
  const sendFile = useCallback(
    async (file: File): Promise<ChatMessage | null> => {
      const fd = new FormData();
      fd.append("file", file);
      const filesEndpoint = `${base}/files`;

      let res: Response;
      if (role === "patient") {
        const token = getPortalToken();
        res = await fetch(filesEndpoint, {
          method: "POST",
          body: fd,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else {
        res = await fetch(filesEndpoint, { method: "POST", body: fd });
      }

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Upload failed");

      // Persist the attachment as a chat message
      const msg = await call<{ message: ChatMessage }>(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: null, attachmentPath: body.path }),
      });
      acceptRow(msg?.message);
      return msg?.message || null;
    },
    [base, call, acceptRow, role]
  );

  return { messages, loading, error, sendMessage, sendFile, senderName };
}