export const SUPPORTED_LANGUAGES = ["en", "hi", "mr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export interface LanguageDef {
  code: SupportedLanguage;
  nativeName: string;
  label: string;
  dir: "ltr" | "rtl";
  /** Intl locale used for dates/numbers/currency */
  intlLocale: string;
}

export const LANGUAGES: Record<SupportedLanguage, LanguageDef> = {
  en: { code: "en", nativeName: "English", label: "English", dir: "ltr", intlLocale: "en-IN" },
  hi: { code: "hi", nativeName: "हिन्दी", label: "हिन्दी", dir: "ltr", intlLocale: "hi-IN" },
  mr: { code: "mr", nativeName: "मराठी", label: "मराठी", dir: "ltr", intlLocale: "mr-IN" },
};

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES as readonly string[];

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

export function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}
