import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import { DEFAULT_LANGUAGE, LANGUAGES, normalizeLanguage } from "./config";

export const LANGUAGE_STORAGE_KEY = "cuely_lang";

export function getStoredLanguage(): string {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function applyLanguageToDocument(lang: string) {
  if (typeof document === "undefined") return;
  const code = normalizeLanguage(lang);
  document.documentElement.lang = code;
  document.documentElement.dir = LANGUAGES[code].dir;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: Object.keys(LANGUAGES),
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  returnNull: false,
  // Never show a raw translation key to a patient in production.
  parseMissingKeyHandler: (key) => (process.env.NODE_ENV === "production" ? "" : key),
});

export default i18n;
