"use client";

import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

export function QueueInactiveState() {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-12 text-center premium-shadow">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold font-sans text-foreground mb-2">{t("queueStates.unavailable")}</h2>
      <p className="text-muted-foreground">
        {t("queueStates.inactive")}
      </p>
    </div>
  );
}
