"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n, { applyLanguageToDocument, LANGUAGE_STORAGE_KEY } from "@/lib/i18n/client";
import { DEFAULT_LANGUAGE, normalizeLanguage } from "@/lib/i18n/config";

interface LanguageContextValue {
  lang: string;
  setLang: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
});

export function LanguageProvider({
  children,
  defaultLang,
}: {
  children: React.ReactNode;
  defaultLang?: string;
}) {
  const [lang, setLangState] = useState<string>(() => {
    if (typeof window === "undefined") return normalizeLanguage(defaultLang || DEFAULT_LANGUAGE);
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored) return normalizeLanguage(stored);
    } catch {}
    return normalizeLanguage(defaultLang || DEFAULT_LANGUAGE);
  });

  useEffect(() => {
    applyLanguageToDocument(lang);
    i18n.changeLanguage(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  const setLang = useCallback((next: string) => {
    const normalized = normalizeLanguage(next);
    setLangState(normalized);
    // Best-effort persistence to the patient profile when signed in.
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem("cuely_portal_session")) {
        fetch("/api/portal/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferred_language: normalized }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
