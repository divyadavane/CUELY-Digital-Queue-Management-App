"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { Ticket, CallNextResponse, MarkServedResponse, MarkNoShowResponse } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export function useTickets(queueId: string | undefined) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const channelRef = useRef<RealtimeChannel | null>(null);

  const supabase = createClient();

  // Fetch tickets for the queue
  const fetchTickets = useCallback(async () => {
    if (!queueId) return;

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("queue_id", queueId)
      .in("status", ["waiting", "called"])
      .order("joined_at", { ascending: true });

    if (!error && data) {
      setTickets(data as Ticket[]);
    }
    setLoading(false);
  }, [queueId, supabase]);

  // Subscribe to Realtime changes
  useEffect(() => {
    if (!queueId) return;

    setLoading(true);
    fetchTickets();

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`tickets-${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          // Re-fetch the full list on any change for consistency
          fetchTickets();
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("disconnected");
        } else if (status === "TIMED_OUT") {
          setConnectionStatus("reconnecting");
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId, fetchTickets, supabase]);

  // Derived state
  const calledTicket = tickets.find((t) => t.status === "called") || null;
  const waitingTickets = tickets.filter((t) => t.status === "waiting");

  // Actions
  const callNext = useCallback(async () => {
    if (!queueId) return { error: "No queue selected" };

    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc("call_next", {
        p_queue_id: queueId,
      });

      if (error) return { error: error.message };

      const result = data as unknown as CallNextResponse;
      if (!result.ticket_id) {
        return { error: result.message || "No one is waiting" };
      }

      // Realtime will update the list, but fetch immediately for responsiveness
      await fetchTickets();
      return { error: null, data: result };
    } finally {
      setActionLoading(false);
    }
  }, [queueId, supabase, fetchTickets]);

  const markServed = useCallback(async (ticketId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc("mark_served", {
        p_ticket_id: ticketId,
      });

      if (error) return { error: error.message };
      await fetchTickets();
      return { error: null, data: data as unknown as MarkServedResponse };
    } finally {
      setActionLoading(false);
    }
  }, [supabase, fetchTickets]);

  const markNoShow = useCallback(async (ticketId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc("mark_no_show", {
        p_ticket_id: ticketId,
      });

      if (error) return { error: error.message };
      await fetchTickets();
      return { error: null, data: data as unknown as MarkNoShowResponse };
    } finally {
      setActionLoading(false);
    }
  }, [supabase, fetchTickets]);

  return {
    tickets,
    calledTicket,
    waitingTickets,
    loading,
    actionLoading,
    connectionStatus,
    callNext,
    markServed,
    markNoShow,
    refetch: fetchTickets,
  };
}
