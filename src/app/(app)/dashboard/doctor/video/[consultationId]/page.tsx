"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { VideoRoom, VideoParticipantInfo } from "@/components/video/VideoRoom";
import { Lock, Video, Clock, PhoneOff } from "lucide-react";

interface JoinResponse {
  roomToken: string;
  consultation: {
    id: string;
    status: string;
    scheduled_start: string;
    patient_name: string | null;
    doctor_name: string | null;
    queue_name: string | null;
  };
}

type LoadState =
  | { phase: "loading" }
  | { phase: "unauthenticated" }
  | { phase: "not-joinable"; reason: string }
  | { phase: "ready"; info: VideoParticipantInfo }
  | { phase: "error"; message: string };

export default function DoctorVideoConsultationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ consultationId: string }>();
  const consultationId = params.consultationId;

  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [exited, setExited] = useState(false);

  useEffect(() => {
    if (!consultationId) return;
    setState({ phase: "loading" });
    fetch(`/api/dashboard/consultations/join?consultationId=${encodeURIComponent(consultationId)}`)
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 401) {
          setState({ phase: "unauthenticated" });
          return;
        }
        if (!res.ok) {
          setState(res.status === 403 ? { phase: "not-joinable", reason: "permission" } : { phase: "error", message: body?.error || t("video.loadFailed") });
          return;
        }
        const data = body as JoinResponse;
        setState({
          phase: "ready",
          info: {
            consultationId: data.consultation.id,
            roomToken: data.roomToken,
            doctorName: data.consultation.doctor_name || data.consultation.queue_name || t("video.doctor"),
            doctorDepartment: null,
            patientName: data.consultation.patient_name,
            scheduledStart: data.consultation.scheduled_start,
            initialStatus: data.consultation.status,
          },
        });
      })
      .catch(() => {
        setState({ phase: "error", message: t("video.loadFailed") });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  if (state.phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <Video className="w-10 h-10 text-blue-500 animate-pulse" />
        <p className="text-sm text-slate-400">{t("video.loadingRoom")}</p>
      </div>
    );
  }

  if (state.phase === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">{t("video.signInRequired")}</h1>
          <p className="text-sm text-slate-400 mb-8">{t("video.signInToJoinDoctor")}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            {t("video.goToLogin")}
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "not-joinable") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">{t("video.notJoinable")}</h1>
          <p className="text-sm text-slate-400 mb-8">{t("video.notJoinableDoctorReason")}</p>
          <button
            onClick={() => router.push("/dashboard/doctor")}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            {t("video.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <PhoneOff className="w-6 h-6 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">{t("video.loadFailed")}</h1>
          <p className="text-sm text-slate-400 mb-8">{state.message}</p>
          <button
            onClick={() => router.push("/dashboard/doctor")}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            {t("video.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  if (exited) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("video.callEnded")}</h1>
          <p className="text-slate-400 text-sm mb-8">{t("video.doctorEndedThanks")}</p>
          <button
            onClick={() => router.push("/dashboard/doctor")}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            {t("video.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  const info = state.info;
  const displayName = info.doctorName;

  return (
    <VideoRoom
      role="doctor"
      info={info}
      displayName={displayName}
      isDoctorPanelEnabled
      onStatusChange={async (status) => {
        if (["ready", "in_call", "completed", "cancelled", "missed"].includes(status)) {
          try {
            await fetch(`/api/dashboard/consultations/${info.consultationId}/status`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
          } catch {
            /* best effort */
          }
        }
      }}
      onComplete={() => setExited(true)}
      onExit={() => router.push("/dashboard/doctor")}
    />
  );
}
