"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { History, Loader2, Star, X } from "lucide-react";
import { portalApi } from "@/lib/portal/client";
import { PortalCard, SectionTitle, StatusPill, EmptyState, LoadingBlock } from "@/components/portal/ui";
import { formatDate } from "@/lib/i18n/format";

interface Visit {
  id: string;
  queue_id: string;
  token_number: number;
  status: string;
  joined_at: string;
  served_at: string | null;
  emergency_type: string | null;
  queues: { name: string; department: string | null; doctor_name: string | null; counter_number: string | null } | null;
}

export function VisitsSection() {
  const { t, i18n } = useTranslation();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [ratedTicketIds, setRatedTicketIds] = useState<Set<string>>(new Set());
  const [ratingTarget, setRatingTarget] = useState<Visit | null>(null);

  const fetchVisits = useCallback(async () => {
    try {
      const [vRes, rRes] = await Promise.all([
        portalApi<{ visits: Visit[] }>("/api/portal/visits"),
        portalApi<{ ratings: any[] }>("/api/portal/ratings"),
      ]);
      setVisits(vRes.visits);
      setRatedTicketIds(
        new Set(rRes.ratings.filter((r) => r.ticket_id).map((r) => String(r.ticket_id)))
      );
    } catch (e) {
      setVisits([]);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  if (visits === null) return <LoadingBlock label={t("visits.loading")} />;

  if (visits.length === 0) {
    return (
      <EmptyState
        icon={<History className="w-6 h-6" />}
        title={t("visits.empty")}
        subtitle={t("visits.emptySub")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle title={t("visits.title")} subtitle={t("visits.subtitle")} />

      <div className="space-y-3">
        {visits.map((v) => {
          const rated = ratedTicketIds.has(v.id);
          const canRate = v.status === "served" && !rated;
          return (
            <PortalCard key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">
                      {v.queues?.doctor_name || v.queues?.name || t("visits.visit")}
                    </p>
                    <span className="text-[10px] font-bold text-slate-500">{t("visits.token", { n: v.token_number })}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {v.queues?.department || t("visits.general")} · {formatDate((v.served_at || v.joined_at).slice(0, 10), i18n.language)}
                  </p>
                  <div className="mt-2.5">
                    <StatusPill status={v.status} />
                  </div>
                </div>
                <div className="shrink-0">
                  {rated ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> {t("visits.rated")}
                    </span>
                  ) : canRate ? (
                    <button
                      onClick={() => setRatingTarget(v)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl transition-all"
                    >
                      <Star className="w-3.5 h-3.5" /> {t("visits.rate")}
                    </button>
                  ) : null}
                </div>
              </div>
            </PortalCard>
          );
        })}
      </div>

      {ratingTarget && (
        <RateVisitModal
          visit={ratingTarget}
          onClose={() => setRatingTarget(null)}
          onDone={() => {
            setRatingTarget(null);
            fetchVisits();
          }}
        />
      )}
    </div>
  );
}

function RateVisitModal({
  visit,
  onClose,
  onDone,
}: {
  visit: Visit;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (value < 1) {
      toast.error(t("visits.tapStar"));
      return;
    }
    setSaving(true);
    try {
      await portalApi("/api/portal/ratings", {
        method: "POST",
        body: JSON.stringify({
          queueId: visit.queue_id,
          ticketId: visit.id,
          ratingValue: value,
          comment: comment.trim() || null,
        }),
      });
      toast.success(t("visits.thanks"));
      onDone();
    } catch (e: any) {
      if (e?.status === 409) {
        toast.error(t("visits.alreadyRated"));
        onDone();
      } else {
        toast.error(e?.message || t("visits.failed"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg font-extrabold text-white">{t("visits.rateTitle")}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-5">
          {t("visits.doctorToken", {
            doctor: visit.queues?.doctor_name || visit.queues?.name || t("visits.visit"),
            n: visit.token_number,
          })}
        </p>

        <div className="flex items-center justify-center gap-2 mb-5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue(star)}
              onMouseEnter={() => setHover(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-9 h-9 ${
                  (hover || value) >= star ? "fill-amber-400 text-amber-400" : "text-slate-600"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("visits.commentPlaceholder")}
          rows={3}
          className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-400 resize-none placeholder:text-slate-500"
        />

        <button
          onClick={submit}
          disabled={saving}
          className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("visits.submitRating")}
        </button>
      </div>
    </div>
  );
}
