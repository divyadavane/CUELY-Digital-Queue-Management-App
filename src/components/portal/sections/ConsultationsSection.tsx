"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  Video,
  Plus,
  Loader2,
  Check,
  Star,
  Wallet,
  Phone,
  Clock,
  Pill,
  ClipboardList,
  X,
  CalendarPlus,
  Stethoscope,
} from "lucide-react";
import { portalApi } from "@/lib/portal/client";
import { PortalCard, SectionTitle, StatusPill, EmptyState, LoadingBlock } from "@/components/portal/ui";
import { formatDate, formatTime, formatCurrency } from "@/lib/i18n/format";
import { useRazorpay } from "@/hooks/useRazorpay";
import { RatingStars } from "@/components/ui/RatingStars";

interface Consultation {
  id: string;
  status: string;
  scheduled_start: string;
  patient_name: string | null;
  doctor: {
    name: string;
    doctor_name: string | null;
    department: string | null;
    avg_rating: number;
    total_ratings: number;
  } | null;
  bill: { id: string; amount: number; status: "paid" | "pending" } | null;
  notes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    updated_at: string;
  } | null;
  prescription: {
    diagnosis: string | null;
    medicine_items: unknown[];
    lab_tests: unknown[];
    follow_up_date: string | null;
    notes: string | null;
    created_at: string;
  } | null;
  rating: { rating_value: number } | null;
}

interface VideoDoctor {
  queue_id: string;
  name: string;
  doctor_name: string | null;
  department: string | null;
  consultation_fee: number;
  avg_rating: number;
  total_ratings: number;
}

const JOINABLE = new Set(["scheduled", "ready", "in_call"]);
const ACTIVE = new Set(["scheduled", "ready", "in_call"]);

export function ConsultationsSection() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[] | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ratingFor, setRatingFor] = useState<Consultation | null>(null);
  const { payBill, paying, payEnabled } = useRazorpay();

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await portalApi<{ consultations: Consultation[] }>("/api/portal/consultations");
      setConsultations(res.consultations);
    } catch (e) {
      setConsultations([]);
    }
  }, []);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const upcoming = (consultations || []).filter((c) => ACTIVE.has(c.status));
  const past = (consultations || []).filter((c) => !ACTIVE.has(c.status));

  const handlePay = async (c: Consultation) => {
    if (!c.bill) return;
    try {
      await payBill(c.bill.id, c.doctor?.doctor_name || c.doctor?.name || t("consultations.doctor"), () => {
        toast.success(t("consultations.paid"));
        fetchConsultations();
      });
    } catch (e: any) {
      if (e?.status === 503 && !payEnabled) toast.error(t("billing.notEnabledToast"));
      else toast.error(e?.message || t("consultations.bookFailed"));
    }
  };

  if (consultations === null) return <LoadingBlock label={t("consultations.loading")} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle title={t("consultations.title")} subtitle={t("consultations.subtitle")} />
        <button
          onClick={() => setShowBook((v) => !v)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t("consultations.bookVideo")}
        </button>
      </div>

      {showBook && (
        <BookConsultationForm
          onDone={() => {
            setShowBook(false);
            fetchConsultations();
          }}
        />
      )}

      {consultations.length === 0 ? (
        <EmptyState
          icon={<Video className="w-6 h-6" />}
          title={t("consultations.empty")}
          subtitle={t("consultations.emptySub")}
          action={
            <button
              onClick={() => setShowBook(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded-xl transition-all"
            >
              {t("consultations.bookVideo")}
            </button>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("consultations.upcoming")}</p>
              {upcoming.map((c) => (
                <PortalCard key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">
                          {c.doctor?.doctor_name || c.doctor?.name || t("consultations.doctor")}
                        </p>
                        <StatusPill status={c.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        {c.doctor?.department || t("consultations.department")}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-blue-300 font-bold">
                        <CalendarPlus className="w-3.5 h-3.5" />
                        {formatDate(c.scheduled_start.slice(0, 10), i18n.language)}
                        <span>·</span>
                        {formatTime(c.scheduled_start, i18n.language)}
                      </div>
                    </div>
                    {c.doctor && c.doctor.total_ratings > 0 && (
                      <div className="flex items-center gap-1 text-amber-300 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {c.doctor.avg_rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    {c.bill?.status === "paid" ? (
                      <button
                        onClick={() => router.push(`/video/${c.id}`)}
                        disabled={!JOINABLE.has(c.status)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                      >
                        <Video className="w-4 h-4" />
                        {t("consultations.joinNow")}
                      </button>
                    ) : c.bill ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          <Wallet className="w-4 h-4 text-amber-300" />
                          {formatCurrency(Number(c.bill.amount), i18n.language)}
                          <span className="text-slate-500 font-medium">{t("consultations.needPayment")}</span>
                        </div>
                        <button
                          disabled={paying}
                          onClick={() => handlePay(c)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                        >
                          {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                          {t("consultations.payNow")}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center">{t("consultations.missing")}</p>
                    )}
                  </div>
                </PortalCard>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("consultations.past")}</p>
              {past.map((c) => (
                <PortalCard key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">
                          {c.doctor?.doctor_name || c.doctor?.name || t("consultations.doctor")}
                        </p>
                        <StatusPill status={c.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        {formatDate(c.scheduled_start.slice(0, 10), i18n.language)}
                        {` · ${formatTime(c.scheduled_start, i18n.language)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="text-[11px] font-bold text-slate-300 hover:text-white shrink-0"
                    >
                      {t("common.view")}
                    </button>
                  </div>

                  {expanded === c.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      {c.prescription || c.notes ? (
                        <>
                          {c.prescription && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                              <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 mb-2">
                                <Pill className="w-3.5 h-3.5" /> {t("consultations.prescriptionTitle")}
                              </p>
                              {c.prescription.diagnosis && (
                                <p className="text-xs text-white mb-2">
                                  <span className="text-slate-400 font-bold">{t("consultations.diagnosis")}: </span>
                                  {c.prescription.diagnosis}
                                </p>
                              )}
                              {Array.isArray(c.prescription.medicine_items) && c.prescription.medicine_items.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t("consultations.medicines")}</p>
                                  <div className="space-y-1">
                                    {(c.prescription.medicine_items as any[]).map((m, i) => (
                                      <p key={i} className="text-xs text-slate-200">
                                        {m?.name} {m?.dosage ? `· ${m.dosage}` : ""} {m?.frequency ? `· ${m.frequency}` : ""} {m?.duration ? `· ${m.duration}` : ""}
                                        {m?.instructions ? <span className="text-slate-400"> — {m.instructions}</span> : ""}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {Array.isArray(c.prescription.lab_tests) && c.prescription.lab_tests.length > 0 && (
                                <p className="text-xs text-slate-300">
                                  <span className="text-slate-400 font-bold">{t("consultations.labTests")}: </span>
                                  {(c.prescription.lab_tests as string[]).join(", ")}
                                </p>
                              )}
                              {c.prescription.follow_up_date && (
                                <p className="text-xs text-slate-300 mt-1">
                                  <span className="text-slate-400 font-bold">{t("consultations.followUp")}: </span>
                                  {formatDate(c.prescription.follow_up_date, i18n.language)}
                                </p>
                              )}
                              {c.prescription.notes && (
                                <p className="text-xs text-slate-300 mt-1">
                                  <span className="text-slate-400 font-bold">{t("consultations.instructions")}: </span>
                                  {c.prescription.notes}
                                </p>
                              )}
                            </div>
                          )}
                          {c.notes && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                              <p className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300 mb-2">
                                <ClipboardList className="w-3.5 h-3.5" /> {t("consultations.notesTitle")}
                              </p>
                              <div className="space-y-1 text-xs text-slate-300">
                                {c.notes.subjective && <p><span className="text-slate-500 font-bold">S: </span>{c.notes.subjective}</p>}
                                {c.notes.objective && <p><span className="text-slate-500 font-bold">O: </span>{c.notes.objective}</p>}
                                {c.notes.assessment && <p><span className="text-slate-500 font-bold">A: </span>{c.notes.assessment}</p>}
                                {c.notes.plan && <p><span className="text-slate-500 font-bold">P: </span>{c.notes.plan}</p>}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-1">
                          {t("consultations.rxEmpty")} · {t("consultations.notesEmpty")}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-400">
                          {c.rating ? (
                            <span className="flex items-center gap-1.5">
                              {t("consultations.rated")}
                              <RatingStars value={c.rating.rating_value} size="xs" />
                            </span>
                          ) : c.status === "completed" ? (
                            t("consultations.noRatingYet")
                          ) : (
                            ""
                          )}
                        </p>
                        {c.status === "completed" && !c.rating && (
                          <button
                            onClick={() => setRatingFor(c)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl transition-all"
                          >
                            <Star className="w-3.5 h-3.5" />
                            {t("consultations.rateVisit")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </PortalCard>
              ))}
            </div>
          )}
        </>
      )}

      {ratingFor && <RatingModal consultation={ratingFor} onClose={() => setRatingFor(null)} onDone={fetchConsultations} />}
    </div>
  );
}

function BookConsultationForm({ onDone }: { onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const [doctors, setDoctors] = useState<VideoDoctor[] | null>(null);
  const [queueId, setQueueId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    portalApi<{ doctors: VideoDoctor[] }>("/api/portal/consultations/doctors")
      .then((res) => {
        setDoctors(res.doctors);
        if (res.doctors.length > 0) setQueueId(res.doctors[0].queue_id);
      })
      .catch(() => setDoctors([]));
  }, []);

  const selected = (doctors || []).find((d) => d.queue_id === queueId);

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueId || !date) {
      toast.error(t("consultations.bookFailed"));
      return;
    }
    setSaving(true);
    try {
      await portalApi("/api/portal/consultations", {
        method: "POST",
        body: JSON.stringify({ queueId, date, time: time || null }),
      });
      toast.success(t("consultations.booked"));
      onDone();
    } catch (e: any) {
      toast.error(e?.message || t("consultations.bookFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalCard className="p-5">
      <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Video className="w-4 h-4 text-blue-400" /> {t("consultations.bookTitle")}
      </p>
      <form onSubmit={book} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("consultations.pickDoctor")}</label>
          {doctors === null ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : doctors.length === 0 ? (
            <p className="text-xs text-slate-500">{t("consultations.missing")}</p>
          ) : (
            <select
              value={queueId}
              onChange={(e) => setQueueId(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
            >
              {doctors.map((d) => (
                <option key={d.queue_id} value={d.queue_id} className="bg-slate-900 text-white">
                  {d.doctor_name || d.name} — {d.department || t("visits.general")}
                </option>
              ))}
            </select>
          )}
        </div>

        {selected && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Stethoscope className="w-4 h-4 text-blue-400" />
              <span>
                {selected.doctor_name || selected.name}
                {selected.total_ratings > 0 && (
                  <span className="ml-2 text-amber-300 font-bold">★ {selected.avg_rating.toFixed(1)}</span>
                )}
              </span>
            </div>
            <span className="text-xs font-bold text-white">{formatCurrency(selected.consultation_fee, i18n.language)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("consultations.date")}</label>
            <input
              type="date"
              required
              min={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("consultations.time")}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || doctors === null || doctors.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {t("consultations.bookBtn")}
        </button>
      </form>
    </PortalCard>
  );
}

function RatingModal({
  consultation,
  onClose,
  onDone,
}: {
  consultation: Consultation;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await portalApi(`/api/portal/consultations/${consultation.id}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      toast.success(t("ratings.submitted"));
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || t("ratings.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0b101d] border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">{t("consultations.rateVisit")}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <RatingStars value={rating} size="lg" interactive onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("ratings.commentPlaceholder")}
            rows={3}
            className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 resize-none"
          />
          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-black" />}
            {t("ratings.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
