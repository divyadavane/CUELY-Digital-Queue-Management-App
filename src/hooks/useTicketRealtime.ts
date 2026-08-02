import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Queue = Database["public"]["Tables"]["queues"]["Row"];

export function useTicketRealtime(ticketId: string | null, queueId: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [avgWaitSeconds, setAvgWaitSeconds] = useState<number>(300); // Default 5 mins
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Initial fetch of ticket, queue, and stats
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    console.log("Fetching queue for ID:", queueId);
    
    // Fetch Queue
    const { data: qData, error: qError } = await supabase
      .from("queues")
      .select("*")
      .eq("id", queueId)
      .single();
    
    if (qError) {
      console.error("Error fetching queue:", JSON.stringify(qError, null, 2), "Full error object:", qError);
    }
    if (qData) setQueue(qData);

    // Fetch Stats for wait time estimate
    const { data: statusData } = await supabase.rpc("get_queue_status", { p_queue_id: queueId });
    if (statusData) {
      const status = statusData as any;
      setAvgWaitSeconds(status.avg_serving_seconds || 300);
    }

    if (!ticketId) {
      setLoading(false);
      return;
    }

    // Fetch Ticket
    const { data: tData } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();
    
    if (tData) {
      setTicket(tData);
      // Calculate position if waiting
      if (tData.status === "waiting") {
        await calculatePosition(tData);
      }
    }
    setLoading(false);
  }, [ticketId, queueId, supabase]);

  // Calculate how many people are ahead
  const calculatePosition = async (currentTicket: Ticket) => {
    // We count waiting tickets in this queue with higher priority, OR same priority but older joined_at
    const { count, error } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", currentTicket.queue_id)
      .eq("status", "waiting")
      .or(`priority.gt.${currentTicket.priority},and(priority.eq.${currentTicket.priority},joined_at.lt.${currentTicket.joined_at})`);

    if (!error && count !== null) {
      setPosition(count + 1); // 1-indexed position
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Realtime Subscriptions
  useEffect(() => {
    // 1. Subscribe to changes on THIS specific ticket
    const ticketChannel = supabase
      .channel(`public:tickets:id=eq.${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload: any) => {
          if (payload.eventType === "UPDATE") {
            const updatedTicket = payload.new as Ticket;
            setTicket(updatedTicket);
          } else if (payload.eventType === "DELETE") {
            setTicket(null);
          }
        }
      )
      .subscribe();

    // 2. Subscribe to ALL tickets in this queue to update position dynamically when others are called/join
    const queueTicketsChannel = supabase
      .channel(`public:tickets:queue_id=eq.${queueId}_pos`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `queue_id=eq.${queueId}`,
        },
        (payload: any) => {
          // Whenever any ticket changes, recalculate position if we are currently waiting
          // We can optimize this by checking if the change actually affects us, but fetching count is safe and fast
          setTicket((current) => {
            if (current && current.status === "waiting") {
              calculatePosition(current);
            }
            return current;
          });
        }
      )
      .subscribe();

    // 3. Subscribe to the queue itself (for paused/active status)
    const queueChannel = supabase
      .channel(`public:queues:id=eq.${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queues",
          filter: `id=eq.${queueId}`,
        },
        (payload: any) => {
          setQueue(payload.new as Queue);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(queueTicketsChannel);
      supabase.removeChannel(queueChannel);
    };
  }, [ticketId, queueId, supabase]);

  // Calculated properties
  const estimatedWaitSeconds = position ? (position - 1) * avgWaitSeconds : 0;
  const estimatedWaitMinutes = Math.max(1, Math.round(estimatedWaitSeconds / 60));

  return {
    ticket,
    queue,
    position,
    estimatedWaitMinutes,
    loading,
    refetch: fetchInitialData
  };
}
