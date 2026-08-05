"use client";

import { useState, useEffect } from "react";
import { X, Save, Globe, Languages } from "lucide-react";
import toast from "react-hot-toast";
import { LANGUAGES, SUPPORTED_LANGUAGES } from "@/lib/i18n/config";

interface BusinessSettingsModalProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessSettingsModal({ businessId, isOpen, onClose }: BusinessSettingsModalProps) {
  const [defaultLanguage, setDefaultLanguage] = useState<string>("en");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isOpen || !businessId) return;
    let cancelled = false;
    setFetching(true);
    fetch(`/api/dashboard/business-settings?businessId=${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.default_language) setDefaultLanguage(data.default_language);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/business-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, defaultLanguage }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update settings");
      } else {
        toast.success("Default patient language updated");
        onClose();
      }
    } catch {
      toast.error("Failed to update settings");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-white">Patient Language</h2>
              <p className="text-xs text-slate-400">Default language for your patient-facing pages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed">
            This is the fallback language shown to patients when they haven&apos;t picked one themselves.
            Patients can always switch languages on the join / track pages, and logged-in patients keep
            their own preference.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Default patient language
            </label>
            {fetching ? (
              <div className="h-11 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ) : (
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full h-11 bg-black/50 border border-white/10 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-accent transition-all"
              >
                {SUPPORTED_LANGUAGES.map((code) => (
                  <option key={code} value={code} className="bg-slate-900 text-white">
                    {LANGUAGES[code].nativeName}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setDefaultLanguage(code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    defaultLanguage === code
                      ? "bg-accent text-white border-accent/40 shadow-lg shadow-accent/20"
                      : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  {LANGUAGES[code].nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-accent hover:brightness-110 text-white shadow-lg shadow-accent/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
