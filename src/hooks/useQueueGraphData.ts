import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

export interface QueueGraphItem {
  id: string;
  token_number: number;
  minutes_waited: number;
  status: Ticket["status"];
  priority: number;
  emergency_type: string | null;
  isSelf: boolean;
}

export function useQueueGraphData(queueId: string, currentTicketId?: string | null) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [graphData, setGraphData] = useState<QueueGraphItem[]>([]);
  const supabase = createClient();

  const fetchTickets = useCallback(async () => {
    if (!queueId) return;

    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("queue_id", queueId)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("joined_at", { ascending: true });

    if (data) {
      setTickets(data);
    }
  }, [queueId, supabase]);

  // Recalculate graph data from tickets
  const updateGraphData = useCallback(() => {
    const now = new Date().getTime();
    const items: QueueGraphItem[] = tickets.map((t) => {
      const joinedTime = new Date(t.joined_at).getTime();
      const minutes = Math.max(0, Math.floor((now - joinedTime) / 60000));
      return {
        id: t.id,
        token_number: t.token_number,
        minutes_waited: minutes,
        status: t.status,
        priority: t.priority,
        emergency_type: t.emergency_type,
        isSelf: t.id === currentTicketId,
      };
    });
    setGraphData(items);
  }, [tickets, currentTicketId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    updateGraphData();
    const timer = setInterval(updateGraphData, 15000); // refresh graph durations every 15s
    return () => clearInterval(timer);
  }, [updateGraphData]);

  // Realtime updates
  useEffect(() => {
    if (!queueId) return;

    const channel = supabase
      .channel(`public:tickets:graph:${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId, supabase, fetchTickets]);

  return graphData;
}
