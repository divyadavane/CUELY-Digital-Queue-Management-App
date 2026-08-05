"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export interface DoctorRating {
  avgRating: number;
  totalRatings: number;
  loading: boolean;
}

export function useDoctorRating(queueId?: string | null): DoctorRating {
  const [rating, setRating] = useState<DoctorRating>(() =>
    queueId ? { avgRating: 0, totalRatings: 0, loading: true } : { avgRating: 0, totalRatings: 0, loading: false }
  );
  const supabase = createClient();

  useEffect(() => {
    if (!queueId) return;

    let cancelled = false;

    const fetchRating = async () => {
      const { data } = await supabase
        .from("queues")
        .select("avg_rating, total_ratings")
        .eq("id", queueId)
        .single();

      if (cancelled) return;

      if (data) {
        setRating({
          avgRating: data.avg_rating ?? 0,
          totalRatings: data.total_ratings ?? 0,
          loading: false,
        });
      } else {
        setRating((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchRating();

    // Keep the badge in sync in real-time: new ratings on this queue,
    // plus aggregate updates on the queues row itself.
    const channel = supabase
      .channel(`ratings:queue:${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ratings",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          fetchRating();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queues",
          filter: `id=eq.${queueId}`,
        },
        () => {
          fetchRating();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [queueId, supabase]);

  return rating;
}
