"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export function PortalCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white/[0.04] border border-white/10 rounded-3xl backdrop-blur-xl shadow-lg shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <PortalCard className="p-8 text-center flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-white text-base">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-5 w-full max-w-xs">{action}</div>}
    </PortalCard>
  );
}

const STATUS_STYLES: Record<string, string> = {
  waiting: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  called: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  serving: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  served: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  completed: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  scheduled: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  cancelled: "bg-red-500/15 border-red-500/30 text-red-300",
  no_show: "bg-red-500/15 border-red-500/30 text-red-300",
  expired: "bg-red-500/15 border-red-500/30 text-red-300",
  left: "bg-slate-500/15 border-slate-500/30 text-slate-300",
  checked_in: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  paid: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  pending: "bg-amber-500/15 border-amber-500/30 text-amber-300",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[status] || "bg-slate-500/15 border-slate-500/30 text-slate-300";
  const text = label || t(`common.status.${status}`, { defaultValue: status.replace("_", " ") });
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {text}
    </span>
  );
}
