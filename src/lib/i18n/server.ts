import i18next from "i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "./config";

// Server-side i18next instance used to pick SMS/WhatsApp templates by the
// patient's preferred language (falling back to the hospital default).
// Uses `{var}` interpolation to match the existing SMS variable syntax.
const serverI18n = i18next.createInstance();

serverI18n.init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: ["en", "hi", "mr"],
  interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
  returnEmptyString: false,
  returnNull: false,
});

export type I18nTranslate = (key: string, vars?: Record<string, unknown>) => string;

export function getTranslator(lang?: string | null): I18nTranslate {
  const lng = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  return (key: string, vars?: Record<string, unknown>) => serverI18n.t(key, { lng, ...vars });
}
