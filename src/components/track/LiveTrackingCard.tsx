"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, XCircle, AlertCircle } from "lucide-react";
import { LeaveQueueButton } from "./LeaveQueueButton";
import { PostCheckupCard } from "./PostCheckupCard";

interface LiveTrackingCardProps {
  ticket: any;
  position: number | null;
  estimatedWaitMinutes: number;
  onClear: () => void;
  isStale?: boolean; // If realtime drops
}

export function LiveTrackingCard({ ticket, position, estimatedWaitMinutes, onClear, isStale }: LiveTrackingCardProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!ticket) return null;

  // States that end the lifecycle
  if (ticket.status === "served") {
    return <PostCheckupCard ticket={ticket} onClear={onClear} />;
  }

  if (ticket.status === "no_show" || ticket.status === "left") {
    return (
      <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-12 text-center premium-shadow">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold font-sans text-foreground mb-3">{t("track.ticketClosed")}</h2>
        <p className="text-muted-foreground mb-8">
          {ticket.status === "no_show"
            ? t("track.noShow")
            : t("track.leftQueue")}
        </p>
        <button onClick={onClear} className="text-accent font-bold hover:underline">{t("track.joinAgain")}</button>
      </div>
    );
  }

  const isCalled = ticket.status === "called";

  return (
    <div className={`w-full max-w-md mx-auto rounded-3xl overflow-hidden transition-all duration-500 ${
      isCalled ? "bg-accent premium-shadow animate-pulse-ring" : "bg-surface border border-border premium-shadow"
    }`}>
      
      <div className={`p-8 md:p-12 text-center ${isCalled ? "text-white" : "text-foreground"}`}>
        
        {isStale && !isCalled && (
          <div className="flex items-center justify-center gap-2 text-orange-500 text-sm font-bold bg-orange-500/10 py-1.5 px-4 rounded-full w-fit mx-auto mb-6">
            <AlertCircle className="w-4 h-4" />
            {t("track.reconnecting")}
          </div>
        )}

        {ticket.customer_name && (
          <div className="mb-2">
            <span className={`text-base font-extrabold px-3 py-1 rounded-full ${
              isCalled ? "bg-white/20 text-white" : "bg-muted text-foreground border border-border"
            }`}>
              {ticket.customer_name}
            </span>
          </div>
        )}

        <div className="mb-2">
          <p className={`text-sm font-bold uppercase tracking-wider ${isCalled ? "text-white/80" : "text-muted-foreground"}`}>
            {t("track.yourToken")}
          </p>
        </div>
        
        <div className="text-7xl md:text-8xl font-black font-sans tracking-tighter mb-8 leading-none">
          {ticket.token_number}
        </div>

        {isCalled ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold tracking-tight">{t("track.beingCalled")}</h2>
            <p className="text-xl text-white/90">{t("track.comeToDesk")}</p>
            {ticket.recall_count > 0 && (
              <p className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full inline-block mt-4">
                {t("track.calledAgain", { n: ticket.recall_count })}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-2xl p-4 border border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("track.position")}</p>
                <p className="text-3xl font-bold text-foreground">
                  {position ? `#${position}` : "--"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {position && position > 1 ? t("track.ahead", { n: position - 1 }) : t("track.youreNext")}
                </p>
              </div>
              <div className="bg-background rounded-2xl p-4 border border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("track.estWait")}</p>
                <p className="text-3xl font-bold text-foreground">
                  ~{estimatedWaitMinutes}<span className="text-lg">m</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("track.avgTime")}
                </p>
              </div>
            </div>

            <div className="text-xs font-medium text-muted-foreground pt-4 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {t("track.liveUpdated", { time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
            </div>
          </div>
        )}
      </div>

      {!isCalled && (
        <div className="bg-muted p-6 border-t border-border">
          <LeaveQueueButton ticketId={ticket.id} onLeft={onClear} />
        </div>
      )}
    </div>
  );
}
