"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { portalApi } from "@/lib/portal/client";
import { PortalCard, SectionTitle, StatusPill, EmptyState, LoadingBlock } from "@/components/portal/ui";
import { formatDate } from "@/lib/i18n/format";
import { RatingStars } from "@/components/ui/RatingStars";

interface MyRating {
  id: string;
  rating_value: number;
  comment: string | null;
  created_at: string;
  queues: { name: string; department: string | null; doctor_name: string | null } | null;
}

export function RatingsSection() {
  const { t, i18n } = useTranslation();
  const [ratings, setRatings] = useState<MyRating[] | null>(null);

  const fetchRatings = useCallback(async () => {
    try {
      const res = await portalApi<{ ratings: MyRating[] }>("/api/portal/ratings");
      setRatings(res.ratings);
    } catch (e) {
      setRatings([]);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  if (ratings === null) return <LoadingBlock label={t("ratings.loading")} />;

  return (
    <div className="space-y-5">
      <SectionTitle title={t("ratings.title")} subtitle={t("ratings.subtitle")} />

      {ratings.length === 0 ? (
        <EmptyState
          icon={<Star className="w-6 h-6" />}
          title={t("ratings.empty")}
          subtitle={t("ratings.emptySub")}
        />
      ) : (
        <div className="space-y-3">
          {ratings.map((r) => (
            <PortalCard key={r.id} className="p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-bold text-white truncate">
                  {r.queues?.doctor_name || r.queues?.name || t("ratings.doctor")}
                </p>
                <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                  {formatDate(r.created_at.slice(0, 10), i18n.language)}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <RatingStars value={r.rating_value} size="md" />
                <span className="text-xs font-bold text-amber-300">{r.rating_value}.0</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <p className="text-[11px] text-slate-400">{r.queues?.department || t("ratings.general")}</p>
                <StatusPill status={`${r.rating_value}star`} label={`${r.rating_value}★`} />
              </div>
              {r.comment && (
                <p className="mt-3 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 leading-relaxed">
                  “{r.comment}”
                </p>
              )}
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}
