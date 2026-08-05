"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { checkInAppointmentAction, cancelAppointmentAction } from "@/actions/queue";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

interface CheckInPromptProps {
  appointmentId: string;
  appointmentDate: string;
  onCheckedIn: (ticketId: string) => void;
  onCancelled: () => void;
}

export function CheckInPrompt({
  appointmentId,
  appointmentDate,
  onCheckedIn,
  onCancelled,
}: CheckInPromptProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const isToday = appointmentDate <= today; // Allowed to check in on or after scheduled date

  const handleCheckIn = async () => {
    setLoading(true);
    const { success, data, error } = await checkInAppointmentAction(appointmentId);

    if (!success) {
      toast.error(error || t("checkin.failed"));
      setLoading(false);
      return;
    }

    if (data && data.ticket_id) {
      toast.success(t("checkin.checkedIn"));
      onCheckedIn(data.ticket_id);
    } else {
      toast.error(t("checkin.noTicket"));
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm(t("checkin.confirmCancel"))) return;
    setLoading(true);
    const { success, error } = await cancelAppointmentAction(appointmentId);

    if (!success) {
      toast.error(error || t("checkin.failedCancel"));
      setLoading(false);
      return;
    }

    toast.success(t("checkin.cancelled"));
    onCancelled();
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-8 md:p-12 text-center premium-shadow">
      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Calendar className="w-8 h-8 text-accent" />
      </div>

      <h2 className="text-3xl font-bold font-sans text-foreground mb-2 tracking-tight">
        {t("checkin.title")}
      </h2>
      <p className="text-muted-foreground text-base mb-6">
        {t("checkin.youHaveAppt", { date: appointmentDate })}
      </p>

      {isToday ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {t("checkin.checkInOpen")}
          </div>

          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {t("checkin.checkInNow")}
          </button>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-2xl text-sm text-muted-foreground mb-6">
          {t("checkin.checkInAvailableOn", { date: appointmentDate })}
        </div>
      )}

      <button
        onClick={handleCancel}
        disabled={loading}
        className="mt-6 text-sm font-semibold text-destructive hover:underline inline-flex items-center gap-1.5"
      >
        <XCircle className="w-4 h-4" />
        {t("checkin.cancelAppointment")}
      </button>
    </div>
  );
}
