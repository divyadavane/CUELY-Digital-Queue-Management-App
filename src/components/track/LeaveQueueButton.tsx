"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface LeaveQueueButtonProps {
  ticketId: string;
  onLeft: () => void;
}

export function LeaveQueueButton({ ticketId, onLeft }: LeaveQueueButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const supabase = createClient();

  const handleLeave = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    const { error } = await supabase.rpc("leave_queue", { p_ticket_id: ticketId });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      setConfirming(false);
      return;
    }

    onLeft();
  };

  return (
    <div className="text-center mt-6">
      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-destructive">{t("leave.confirm")}</p>
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => setConfirming(false)}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              {t("leave.cancel")}
            </button>
            <button 
              onClick={handleLeave}
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-destructive bg-destructive/10 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
            >
              {loading ? t("leave.leaving") : t("leave.yesLeave")}
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={handleLeave}
          className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors underline underline-offset-4"
        >
          {t("leave.cantMakeIt")}
        </button>
      )}
    </div>
  );
}
