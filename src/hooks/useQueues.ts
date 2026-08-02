"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { Queue } from "@/types/database";

export function useQueues(businessId: string | undefined) {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const fetchQueues = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("queues")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setQueues(data as Queue[]);
        // Auto-select first queue if none selected
        if (!selectedQueue && data.length > 0) {
          setSelectedQueue(data[0] as Queue);
        }
      }
      setLoading(false);
    };

    fetchQueues();
  }, [businessId, supabase, selectedQueue]);

  return { queues, selectedQueue, setSelectedQueue, loading };
}
