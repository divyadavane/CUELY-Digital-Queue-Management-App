"use client";

import { useDoctorRating } from "@/hooks/useDoctorRating";
import { RatingStars } from "@/components/ui/RatingStars";

interface DoctorRatingBadgeProps {
  queueId?: string | null;
  className?: string;
}

export function DoctorRatingBadge({ queueId, className }: DoctorRatingBadgeProps) {
  const { avgRating, totalRatings } = useDoctorRating(queueId);

  if (totalRatings === 0) {
    return (
      <span className={`inline-flex items-center text-xs text-muted-foreground ${className ?? ""}`}>
        No ratings yet
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className ?? ""}`}>
      <RatingStars value={avgRating} size="xs" />
      <span className="font-bold text-amber-400">{avgRating.toFixed(1)}</span>
      <span>· {totalRatings} {totalRatings === 1 ? "review" : "reviews"}</span>
    </span>
  );
}
