"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Stethoscope, CalendarClock, Video, Wifi, WifiOff, Mic, Camera, ArrowRight } from "lucide-react";
import { formatTime, formatDate } from "@/lib/i18n/format";

interface WaitingRoomProps {
  isPatient: boolean;
  doctorName: string;
  doctorDepartment: string | null;
  patientName: string | null;
  scheduledStart: string;
  status: string;
  onJoin: (stream?: MediaStream) => void;
}

export function WaitingRoom({
  isPatient,
  doctorName,
  doctorDepartment,
  patientName,
  scheduledStart,
  status,
  onJoin,
}: WaitingRoomProps) {
  const { t, i18n } = useTranslation();
  const [networkOk, setNetworkOk] = useState(true);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const handedOffRef = useRef(false);

  useEffect(() => {
    const online = () => setNetworkOk(true);
    const offline = () => setNetworkOk(false);
    setNetworkOk(navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    setPreviewStream(null);
    setPreviewError(null);
    setCameraOk(false);
    setMicOk(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        setPreviewStream(s);
        setCameraOk(s.getVideoTracks().length > 0);
        setMicOk(s.getAudioTracks().length > 0);
        setPreviewError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setPreviewError(e?.name === "NotAllowedError" ? "permission" : "device");
        setCameraOk(false);
        setMicOk(false);
      });
    return () => {
      cancelled = true;
      // Only stop the preview tracks if they weren't handed off to the call.
      if (!handedOffRef.current) stream?.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
    };
  }, [retryKey]);

  const subtitle = isPatient ? t("video.waitingSub", { doctor: doctorName }) : t("video.waitingSubDoctor", { patient: patientName || t("video.patient") });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Video className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{t("video.cuelyTelemedicine")}</p>
            <p className="text-[10px] text-slate-400 font-medium">{isPatient ? t("video.patientView") : t("video.doctorView")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {networkOk ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> {t("video.networkStable")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> {t("video.networkOffline")}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight">{t("video.waitingRoom")}</h1>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
            <CalendarClock className="w-4 h-4" />
            <span>
              {formatDate(scheduledStart.slice(0, 10), i18n.language)} · {formatTime(scheduledStart, i18n.language)}
            </span>
            {doctorDepartment && <span className="text-slate-500">· {doctorDepartment}</span>}
          </div>

          {/* Device preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-4">
            {previewStream ? (
              <video
                ref={(el) => {
                  if (el) el.srcObject = previewStream;
                }}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isPatient ? "-scale-x-100" : ""}`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Camera className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-500">
                  {previewError === "permission" ? t("video.cameraPermission") : t("video.cameraUnavailable")}
                </p>
                {previewError && (
                  <button
                    onClick={() => setRetryKey((k) => k + 1)}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                  >
                    {t("video.retryCamera")}
                  </button>
                )}
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cameraOk ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                <Camera className="w-3 h-3" /> {cameraOk ? t("video.cameraOn") : t("video.cameraOff")}
              </span>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${micOk ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                <Mic className="w-3 h-3" /> {micOk ? t("video.micOn") : t("video.micOff")}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              handedOffRef.current = true;
              onJoin(previewStream || undefined);
            }}
            disabled={status === "cancelled" || status === "missed"}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-4 h-4" />
            {t("video.joinMeeting")}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
            {t("video.instructions")}
          </p>
        </div>
      </main>
    </div>
  );
}
