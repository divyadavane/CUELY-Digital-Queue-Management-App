"use client";

import { useTranslation } from "react-i18next";
import type { TicketStatus } from "@/types/database";

const statusConfig: Record<TicketStatus, { className: string }> = {
  waiting: {
    className: "bg-status-waiting/15 text-status-waiting border border-status-waiting/30",
  },
  called: {
    className: "bg-status-called/15 text-status-called border border-status-called/30 animate-pulse-glow",
  },
  serving: {
    className: "bg-status-called/15 text-status-called border border-status-called/30",
  },
  served: {
    className: "bg-status-served/15 text-status-served border border-status-served/30",
  },
  no_show: {
    className: "bg-status-noshow/15 text-status-noshow border border-status-noshow/30",
  },
  left: {
    className: "bg-status-left/15 text-status-left border border-status-left/30",
  },
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const label = t(`common.status.${status}`, { defaultValue: status });

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {status === "called" && (
        <span className="w-1.5 h-1.5 bg-status-called rounded-full mr-1.5" />
      )}
      {label}
    </span>
  );
}
