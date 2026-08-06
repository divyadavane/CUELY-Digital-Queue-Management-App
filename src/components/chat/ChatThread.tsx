"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Stethoscope,
  Loader2,
  FileText,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useConsultationChat, ChatRole } from "@/hooks/useConsultationChat";

interface ChatThreadProps {
  consultationId: string;
  role: ChatRole;
  senderName: string;
  title: string;
  subtitle?: string | null;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatThread({
  consultationId,
  role,
  senderName,
  title,
  subtitle,
  onBack,
  onClose,
  className = "",
}: ChatThreadProps) {
  const { t } = useTranslation();
  const { messages, loading, error, sendMessage, sendFile } = useConsultationChat({
    consultationId,
    role,
    senderName,
  });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSelf = (msgRole: string) => msgRole === role;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submitText = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendMessage(text);
      setDraft("");
    } catch (e: any) {
      toast.error(e?.message || t("chat.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const pickFile = async (file: File | undefined | null) => {
    if (!file || sending) return;
    setSending(true);
    try {
      await sendFile(file);
    } catch (e: any) {
      toast.error(e?.message || t("chat.uploadFailed"));
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col bg-[#0a0f1c] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <Stethoscope className="w-4 h-4 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium truncate">{subtitle}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        )}
        {!loading && error && (
          <p className="text-center text-xs text-red-400 py-4">{error}</p>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="text-center py-10">
            <Stethoscope className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t("chat.empty")}</p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = isSelf(msg.sender_role);
          const isImage = !!msg.attachment_url && IMAGE_RE.test(msg.attachment_url);
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  mine
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white/5 border border-white/10 text-slate-100 rounded-bl-sm"
                }`}
              >
                {!mine && (
                  <p className="text-[9px] font-bold text-blue-300 mb-1">{msg.sender_name || title}</p>
                )}
                {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                {msg.attachment_url && msg.url && isImage && (
                  <a href={msg.url} target="_blank" rel="noreferrer" className="block mt-1.5">
                    <img
                      src={msg.url}
                      alt={msg.attachment_url}
                      className="max-h-48 w-auto rounded-xl object-cover"
                    />
                  </a>
                )}
                {msg.attachment_url && !isImage && (
                  <a
                    href={msg.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/10"
                  >
                    {msg.url ? (
                      <FileText className="w-4 h-4 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold truncate">
                      {msg.attachment_url.split("/").pop()}
                    </span>
                  </a>
                )}
                <p className={`text-[9px] mt-1 ${mine ? "text-blue-200/70" : "text-slate-500"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 px-3 py-3 border-t border-white/10 bg-[#0a0f1c]">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-50"
            title={t("chat.attach")}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitText();
              }
            }}
            placeholder={t("chat.typeMessage")}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          <button
            onClick={submitText}
            disabled={!draft.trim() || sending}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 flex items-center justify-center"
            title={t("chat.send")}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
