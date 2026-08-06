"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Stethoscope, Loader2 } from "lucide-react";
import { portalApi } from "@/lib/portal/client";
import { usePortalSession } from "@/hooks/usePortalSession";
import { ChatThread } from "@/components/chat/ChatThread";
import { SectionTitle, EmptyState, LoadingBlock } from "@/components/portal/ui";

interface Conversation {
  consultation_id: string;
  doctor_name: string | null;
  doctor_department: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

function timeLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export function MessagesSection({ onRefresh }: { onRefresh?: () => void }) {
  const { t } = useTranslation();
  const { profile } = usePortalSession();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    portalApi<{ conversations: Conversation[] }>("/api/portal/messages")
      .then((res) => setConversations(res.conversations || []))
      .catch((e) => setError(e?.message || "Failed to load messages"))
      .finally(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openThread = (conv: Conversation) => {
    setSelected(conv);
    // refresh unread counts when returning to the list
    load();
    onRefresh?.();
  };

  const senderName = profile?.name || profile?.phone || "Patient";

  if (selected) {
    return (
      <ChatThread
        consultationId={selected.consultation_id}
        role="patient"
        senderName={senderName}
        title={selected.doctor_name || t("chat.doctor")}
        subtitle={selected.doctor_department}
        onBack={() => {
          setSelected(null);
          load();
          onRefresh?.();
        }}
        className="h-[calc(100dvh-13.5rem)] min-h-[30rem] rounded-2xl border border-white/10 overflow-hidden"
      />
    );
  }

  return (
    <div>
      <SectionTitle title={t("portal.nav.messages")} subtitle={t("chat.listSubtitle")} />
      {!conversations && !error && <LoadingBlock />}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {conversations && conversations.length === 0 && (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6 text-slate-600" />}
          title={t("chat.noChats")}
          subtitle={t("chat.noChatsSub")}
        />
      )}
      {conversations && conversations.length > 0 && (
        <div className="mt-4 space-y-2">
          {conversations.map((conv, idx) => (
            <button
              key={`${conv.consultation_id || "conv"}-${idx}`}
              onClick={() => openThread(conv)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate">{conv.doctor_name || t("chat.doctor")}</p>
                  {conv.last_message_at && (
                    <span className="text-[10px] text-slate-500 shrink-0">{timeLabel(conv.last_message_at)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-400 truncate">
                    {conv.last_message || t("chat.tapToStart")}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
