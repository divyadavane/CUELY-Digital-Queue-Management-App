"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { bookAppointmentAction } from "@/actions/queue";
import { Calendar, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";

interface BookAppointmentFormProps {
  queueId: string;
  onBooked: (appointmentId: string, appointmentDate: string) => void;
}

export const EMERGENCY_TYPES = [
  { value: "routine", label: "Routine Visit (General checkup)" },
  { value: "urgent", label: "Urgent (Needs prompt care)" },
  { value: "critical", label: "Severe / Emergency (Immediate attention)" },
  { value: "follow_up", label: "Follow-up Visit" },
  { value: "other", label: "Other" },
];

export function BookAppointmentForm({ queueId, onBooked }: BookAppointmentFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyType, setEmergencyType] = useState("routine");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<{ start: string; available: boolean }[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);

  // fetch live availability whenever doctor / date / type changes
  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setTime("");
    fetch(
      `/api/slots?queueId=${encodeURIComponent(queueId)}&date=${date}&appointmentType=${emergencyType}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        setSlots(res.slots || []);
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [queueId, date, emergencyType]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error(t("book.nameRequired"));
      return;
    }
    if (!time) {
      toast.error(t("book.pickSlot"));
      return;
    }

    setLoading(true);
    const { success, data, error } = await bookAppointmentAction(
      queueId,
      phone,
      emergencyType,
      date,
      time,
      name
    );

    if (!success) {
      toast.error(error || t("book.failed"));
      setLoading(false);
      return;
    }

    if (data && data.appointment_id) {
      toast.success(t("book.success"));
      onBooked(data.appointment_id, date);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-8 md:p-12 premium-shadow">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-sans text-foreground mb-3 tracking-tight">{t("book.title")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("book.subtitle")}
        </p>
      </div>

      <form onSubmit={handleBook} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            {t("book.fullName")}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("book.namePlaceholder")}
            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            {t("book.phone")}
          </label>
          <CountryPhoneInput
            required
            value={phone}
            onChange={(fullPhone) => setPhone(fullPhone)}
            placeholder="98765 43210"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t("book.urgency")}
          </label>
          <select
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-base"
          >
            {EMERGENCY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(`common.emergency.${type.value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent" />
              {t("book.date")}
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              {t("book.time")}
            </label>
            {loadingSlots ? (
              <div className="flex items-center h-[46px]">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              </div>
            ) : (
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!slots || slots.filter((s) => s.available).length === 0}
                className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm disabled:opacity-50"
              >
                <option value="">{t("book.pickSlot")}</option>
                {(slots || [])
                  .filter((s) => s.available)
                  .map((s) => (
                    <option key={s.start} value={s.start}>
                      {s.start}
                    </option>
                  ))}
              </select>
            )}
            {slots && slots.filter((s) => s.available).length === 0 && !loadingSlots && (
              <p className="text-xs text-amber-600 mt-1">{t("book.noSlots")}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {t("book.submit")}
        </button>
      </form>
    </div>
  );
}
