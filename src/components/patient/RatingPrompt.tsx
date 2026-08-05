"use client";

import { useState, useRef } from "react";
import { Heart, Send, CheckCircle2 } from "lucide-react";
import { RatingStars } from "@/components/ui/RatingStars";

interface RatingPromptProps {
  queueId: string;
  ticketId?: string;
  patientName?: string;
  doctorName?: string;
  onDismiss?: () => void;
}

export function RatingPrompt({ queueId, ticketId, patientName, doctorName, onDismiss }: RatingPromptProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "done" | "already_rated">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId,
          ticketId: ticketId ?? null,
          patientName: patientName ?? null,
          ratingValue: rating,
          comment: comment.trim() || null,
        }),
      });

      if (res.status === 409) {
        setStatus("already_rated");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setStatus("done");
      setSubmitting(false);
      timerRef.current = setTimeout(() => {
        setDismissed(true);
        onDismiss?.();
      }, 2000);
    } catch {
      setError("Could not submit your rating. Please try again.");
      setSubmitting(false);
    }
  };

  if (dismissed) return null;

  return (
    <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl shadow-xl">
      {status === "done" ? (
        <div className="text-center py-4 animate-in fade-in">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="font-bold text-white">Thanks for your feedback!</p>
          <p className="text-xs text-slate-400 mt-1">Your rating helps other patients.</p>
        </div>
      ) : status === "already_rated" ? (
        <div className="text-center py-4">
          <p className="font-bold text-slate-300">You have already rated this visit.</p>
          <p className="text-xs text-slate-500 mt-1">Thank you for your feedback!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-white">
              {doctorName ? `How was your visit with ${doctorName}?` : "How was your visit?"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">Tap a star to rate your experience (1–5)</p>

          <div className="flex items-center justify-center py-3 bg-white/5 border border-white/10 rounded-2xl mb-4">
            <RatingStars value={rating} size="lg" interactive onChange={setRating} />
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: share a short comment about your visit…"
            rows={2}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/60 transition-all resize-none"
          />

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Submitting…" : "Submit Rating"}
          </button>
        </form>
      )}
    </div>
  );
}
