"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Loader2, LogOut, Mail, MessageSquare, Phone, Save, User } from "lucide-react";
import { portalApi, clearPortalToken } from "@/lib/portal/client";
import { PortalCard, SectionTitle } from "@/components/portal/ui";
import { PatientProfile } from "@/types/database";
import { LANGUAGES } from "@/lib/i18n/config";
import { formatMonthYear } from "@/lib/i18n/format";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface ProfileSectionProps {
  profile: PatientProfile;
  onUpdated: (profile: PatientProfile) => void;
}

const PREFS = [
  { key: "sms", labelKey: "profile.smsAlerts", descriptionKey: "profile.smsAlertsSub" },
  { key: "whatsapp", labelKey: "profile.whatsappAlerts", descriptionKey: "profile.whatsappAlertsSub" },
  { key: "email", labelKey: "profile.emailAlerts", descriptionKey: "profile.emailAlertsSub" },
];

export function ProfileSection({ profile, onUpdated }: ProfileSectionProps) {
  const { t, i18n } = useTranslation();
  const { lang, setLang } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(profile.notification_prefs || {});
  const [preferredLanguage, setPreferredLanguage] = useState(profile.preferred_language || lang);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setName(profile.name || "");
    setEmail(profile.email || "");
    setPrefs(profile.notification_prefs || {});
    setPreferredLanguage(profile.preferred_language || lang);
  }, [profile, lang]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await portalApi<{ profile: PatientProfile }>("/api/portal/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email, notification_prefs: prefs, preferred_language: preferredLanguage }),
      });
      onUpdated(res.profile);
      setLang(preferredLanguage);
      toast.success(t("profile.updated"));
    } catch (e: any) {
      toast.error(e?.message || t("profile.failed"));
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await portalApi("/api/portal/logout", { method: "POST" });
    } catch (e) {}
    clearPortalToken();
    router.replace("/portal/login");
  };

  return (
    <div className="space-y-5">
      <SectionTitle title={t("profile.title")} subtitle={t("profile.subtitle")} />

      {/* Identity card */}
      <PortalCard className="p-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-900/40">
          <User className="w-8 h-8 text-white" />
        </div>
        <p className="text-lg font-extrabold text-white">{profile.name || t("profile.patient")}</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{profile.phone}</p>
        <p className="text-[10px] text-slate-500 mt-2">
          {t("profile.memberSince", { date: formatMonthYear(profile.created_at, i18n.language) })}
        </p>
      </PortalCard>

      {/* Edit details */}
      <PortalCard className="p-5">
        <p className="text-sm font-bold text-white mb-4">{t("profile.personalDetails")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("profile.fullName")}</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.fullNamePlaceholder")}
                className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl pl-10 pr-3.5 py-3 focus:outline-none focus:border-blue-400 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("profile.phone")}</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={profile.phone}
                readOnly
                disabled
                className="w-full bg-black/20 border border-white/5 text-slate-400 text-sm rounded-xl pl-10 pr-3.5 py-3 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("profile.email")}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("profile.emailPlaceholder")}
                className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl pl-10 pr-3.5 py-3 focus:outline-none focus:border-blue-400 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{t("profile.preferredLanguage")}</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-400"
            >
              {Object.values(LANGUAGES).map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.nativeName}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1.5">{t("profile.preferredLanguageSub")}</p>
          </div>
        </div>
      </PortalCard>

      {/* Notification preferences */}
      <PortalCard className="p-5">
        <p className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" /> {t("profile.notificationPrefs")}
        </p>
        <p className="text-[11px] text-slate-400 font-medium mb-4">
          {t("profile.notificationPrefsSub")}
        </p>
        <div className="space-y-3">
          {PREFS.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{t(p.labelKey)}</p>
                <p className="text-[11px] text-slate-400 font-medium">{t(p.descriptionKey)}</p>
              </div>
              <button
                onClick={() => setPrefs((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  prefs[p.key] ? "bg-blue-600" : "bg-white/10"
                }`}
                aria-pressed={prefs[p.key]}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    prefs[p.key] ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </PortalCard>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t("profile.saveChanges")}
      </button>

      <button
        onClick={logout}
        disabled={loggingOut}
        className="w-full bg-white/5 hover:bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        {t("profile.signOut")}
      </button>
    </div>
  );
}
