"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Stethoscope, Loader2, User } from "lucide-react";
import { ChatThread } from "@/components/chat/ChatThread";
import { useUnreadChatCount } from "@/hooks/useUnreadChatCount";

interface Conversation {
  consultation_id: string;
  doctor_name: string | null;
  doctor_department: string | null;
  patient_name: string | null;
  patient_phone: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

function timeLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

interface MessagesPanelProps {
  queueId: string;
  doctorName: string;
}

export function MessagesPanel({ queueId, doctorName }: MessagesPanelProps) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const { unread, refresh: refreshUnread } = useUnreadChatCount({ role: "doctor", queueId });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/messages?queueId=${encodeURIComponent(queueId)}`);
      const { conversations } = await res.json();
      setConversations(conversations || []);
    } catch {
      setConversations([]);
    }
  }, [queueId]);

  useEffect(() => {
    load();
  }, [load]);

  if (selected) {
    return (
      <ChatThread
        consultationId={selected.consultation_id}
        role="doctor"
        senderName={doctorName}
        title={selected.patient_name || selected.patient_phone || t("chat.patient")}
        subtitle={t("chat.patient")}
        onBack={() => {
          setSelected(null);
          load();
          refreshUnread();
        }}
        className="h-[32rem] rounded-3xl border border-white/10 overflow-hidden shadow-xl"
      />
    );
  }

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4 bg-white/5">
        <div>
          <h2 className="font-bold text-lg text-white font-sans flex items-center gap-2">
            <span className="relative">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-slate-900">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </span>
            {t("chat.doctorInbox")}
          </h2>
          <p className="text-xs text-slate-400">{t("chat.doctorInboxSub")}</p>
        </div>
      </div>

      <div className="p-4">
        {conversations === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white mb-1">{t("chat.noChatsDoctor")}</p>
            <p className="text-xs">{t("chat.noChatsDoctorSub")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv, idx) => (
              <button
                key={`${conv.consultation_id || "conv"}-${idx}`}
                onClick={() => setSelected(conv)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 border border-white/10 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate text-white">
                      {conv.patient_name || conv.patient_phone || t("chat.patient")}
                    </p>
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
    </div>
  );
}