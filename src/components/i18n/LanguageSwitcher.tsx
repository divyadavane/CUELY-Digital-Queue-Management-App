"use client";

import { Languages, ChevronDown } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n/config";
import { useLanguage } from "./LanguageProvider";

interface LanguageSwitcherProps {
  align?: "left" | "right";
  size?: "sm" | "md";
}

export function LanguageSwitcher({ align = "left", size = "sm" }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  const sizing =
    size === "sm"
      ? "px-2.5 py-1.5 text-xs"
      : "px-3.5 py-2 text-sm";

  return (
    <div className={`relative inline-block ${align === "right" ? "text-right" : "text-left"}`}>
      <label className="sr-only">Language / भाषा / भाषा</label>
      <div className="relative">
        <Languages className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className={`appearance-none cursor-pointer pl-8 pr-8 rounded-xl bg-surface border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-accent transition-all ${sizing}`}
        >
          {Object.values(LANGUAGES).map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}
