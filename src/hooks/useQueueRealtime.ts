import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import toast from "react-hot-toast";
import { calculateUrgency } from "@/lib/urgency";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Queue = Database["public"]["Tables"]["queues"]["Row"];

export function useQueueRealtime(activeQueueId: string | null, initialQueues: Queue[] = []) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [queues, setQueues] = useState<Queue[]>(initialQueues);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Load mute preference
    const stored = localStorage.getItem("cuely_mute_audio");
    if (stored === "true") setIsMuted(true);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem("cuely_mute_audio", String(next));
      return next;
    });
  }, []);

  const playPing = useCallback(() => {
    if (isMuted) return;
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  }, [isMuted]);

  const playCriticalAlarm = useCallback(() => {
    if (isMuted) return;
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/emergency/siren_short.ogg");
      audio.volume = 0.9;
      audio.play().catch(() => {});
    } catch (e) {}
  }, [isMuted]);

  const fetchTickets = useCallback(async () => {
    if (!activeQueueId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("queue_id", activeQueueId)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("joined_at", { ascending: true });

    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  }, [activeQueueId]);

  useEffect(() => {
    fetchTickets();
    // Safety-net: refetch every 15s in case a realtime event is missed
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  useEffect(() => {
    if (!activeQueueId) return;

    const ticketsChannel = supabase
      .channel(`public:tickets:queue_id=eq.${activeQueueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `queue_id=eq.${activeQueueId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newTicket = payload.new as Ticket;
            if (newTicket.status === "waiting" || newTicket.status === "called") {
              setTickets((prev) => [...prev, newTicket]);
              const urgency = calculateUrgency(newTicket);
              if (urgency.level === "critical") {
                playCriticalAlarm();
                toast.error(`🚨 CRITICAL PATIENT JOINED: Token #${newTicket.token_number} (${newTicket.customer_name || "Emergency"})`, {
                  duration: 8000,
                });
              } else {
                playPing();
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedTicket = payload.new as Ticket;
            setTickets((prev) => {
              if (updatedTicket.status !== "waiting" && updatedTicket.status !== "called") {
                return prev.filter((t) => t.id !== updatedTicket.id);
              }
              const exists = prev.find((t) => t.id === updatedTicket.id);
              if (exists) {
                return prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
              } else {
                return [...prev, updatedTicket];
              }
            });
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const queuesChannel = supabase
      .channel(`public:queues`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "queues" },
        (payload: any) => {
          const updatedQueue = payload.new as Queue;
          setQueues(prev => prev.map(q => q.id === updatedQueue.id ? updatedQueue : q));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(queuesChannel);
    };
  }, [activeQueueId, supabase, playPing]);

  // Ensure sorting is applied to local state updates too
  const sortedTickets = [...tickets].sort((a, b) => {
    if (a.status === "called" && b.status !== "called") return -1;
    if (a.status !== "called" && b.status === "called") return 1;
    if (a.priority !== b.priority) return b.priority - a.priority; // DESC
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime(); // ASC
  });

  return { 
    tickets: sortedTickets, 
    loading, 
    refetch: fetchTickets, 
    queues,
    isMuted,
    toggleMute
  };
}
