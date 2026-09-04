"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { CuelyLogo } from "@/components/ui/CuelyLogo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { portalApi, setPortalToken } from "@/lib/portal/client";

interface RequestOtpResponse {
  success: boolean;
  expiresAt?: string;
  delivery?: {
    success: boolean;
    sentViaService?: boolean;
    error?: string;
  };
}

export function PortalLogin() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliveryMsg, setDeliveryMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setResendIn(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (phone.trim().length < 8) {
      setError(t("login.validPhone"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await portalApi<RequestOtpResponse>("/api/portal/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone, preferred_language: i18n.language }),
      });
      if (res.delivery) {
        setDeliveryMsg(
          res.delivery.success
            ? { ok: true, text: t("login.codeSent") }
            : { ok: false, text: res.delivery.error || t("login.deliveryFailed") }
        );
      }
      setStep("otp");
      startResendTimer();
    } catch (e: any) {
      setError(e?.message || t("login.sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // If user pasted or typed multiple digits
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < 6 && i < digits.length; i++) {
        next[i] = digits[i];
      }
      setOtp(next);
      const focusIndex = Math.min(digits.length, 5);
      document.getElementById(`otp-${focusIndex}`)?.focus();
      return;
    }

    const digit = digits.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setOtp(next);
    const focusIndex = Math.min(pasted.length, 5);
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError(t("login.enterCodeError"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await portalApi<{ success: boolean; token: string }>("/api/portal/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      });
      setPortalToken(res.token);
      router.replace("/portal");
    } catch (e: any) {
      setError(e?.message || t("login.invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-manrope flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-end gap-2 mb-4">
            <ThemeToggle className="border border-border bg-card text-foreground" />
            <LanguageSwitcher align="right" />
          </div>
          <CuelyLogo size="lg" showGlow className="mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-foreground">{t("login.portalTitle")}</h1>
          <p className="text-xs text-muted-foreground font-medium mt-1.5">
            {t("login.portalSubtitle")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
          {step === "phone" ? (
            <div className="p-6 md:p-8">
              <h2 className="text-lg font-extrabold text-foreground mb-1">{t("login.loginPhone")}</h2>
              <p className="text-xs text-muted-foreground font-medium mb-6">
                {t("login.loginSubtitle")}
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
                  {error}
                </div>
              )}

              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("login.phoneLabel")}</label>
              <CountryPhoneInput value={phone} onChange={setPhone} placeholder="89836 75270" required />

              <button
                onClick={sendOtp}
                disabled={loading}
                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/25"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {t("login.sendOtp")}
              </button>

              <p className="text-[10px] text-muted-foreground text-center mt-4 leading-relaxed">
                {t("login.consent")}
              </p>
            </div>
          ) : (
            <div className="p-6 md:p-8">
              <button
                onClick={() => setStep("phone")}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground mb-5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {t("login.back")}
              </button>

              <h2 className="text-lg font-extrabold text-foreground mb-1">{t("login.enterCode")}</h2>
              <p className="text-xs text-muted-foreground font-medium mb-6">
                {t("login.sentTo", { phone: "" })}
                <span className="text-foreground font-bold">{phone}</span>
              </p>

              {deliveryMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs font-semibold border ${
                    deliveryMsg.ok
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  }`}
                >
                  {deliveryMsg.text}
                </div>
              )}

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onPaste={handlePaste}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 bg-background border border-border text-foreground text-xl font-black text-center rounded-xl focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                  />
                ))}
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.join("").length < 6}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/25"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {t("login.verifyLogin")}
              </button>

              <div className="text-center mt-4">
                {resendIn > 0 ? (
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {t("login.resendIn", { n: resendIn })}
                  </p>
                ) : (
                  <button
                    onClick={sendOtp}
                    className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 mx-auto"
                  >
                    {t("login.resend")} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          {t("login.poweredBy")}
        </p>
      </div>
    </div>
  );
}
