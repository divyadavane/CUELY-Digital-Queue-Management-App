import { DEFAULT_LANGUAGE, LANGUAGES, normalizeLanguage } from "./config";

export function getIntlLocale(lang?: string | null): string {
  const code = normalizeLanguage(lang ?? DEFAULT_LANGUAGE);
  return LANGUAGES[code].intlLocale;
}

export function formatDate(dateStr?: string | null, lang?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(getIntlLocale(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatMonthYear(dateStr?: string | null, lang?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(getIntlLocale(lang), {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(dateStr?: string | null, lang?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(getIntlLocale(lang), {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatNumber(n: number, lang?: string | null): string {
  return new Intl.NumberFormat(getIntlLocale(lang)).format(n);
}

export function formatCurrency(amount: number, lang?: string | null): string {
  return new Intl.NumberFormat(getIntlLocale(lang), {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMinutes(mins: number, lang?: string | null): string {
  return `${new Intl.NumberFormat(getIntlLocale(lang)).format(Math.round(mins))} ${lang === "en" ? "m" : "मि"}`;
}
