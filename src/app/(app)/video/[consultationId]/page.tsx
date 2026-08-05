"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { VideoRoom, VideoParticipantInfo } from "@/components/video/VideoRoom";
import { getPortalToken, portalApi } from "@/lib/portal/client";
import { Lock, Video, PhoneOff, Clock } from "lucide-react";

interface JoinResponse {
  consultation: {
    id: string;
    status: string;
    scheduled_start: string;
    patient_name: string | null;
    doctor: { name: string; doctor_name: string | null; department: string | null } | null;
  };
  roomToken: string;
}

type LoadState =
  | { phase: "loading" }
  | { phase: "unauthenticated" }
  | { phase: "not-joinable"; reason: string }
  | { phase: "ready"; info: VideoParticipantInfo }
  | { phase: "error"; message: string };

export default function VideoConsultationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ consultationId: string }>();
  const consultationId = params.consultationId;

  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [exited, setExited] = useState(false);

  useEffect(() => {
    if (!consultationId) return;
    if (!getPortalToken()) {
      setState({ phase: "unauthenticated" });
      return;
    }
    setState({ phase: "loading" });
    portalApi<JoinResponse>(
      `/api/portal/consultations/join?consultationId=${encodeURIComponent(consultationId)}`
    )
      .then((res) => {
        const doctorName = res.consultation.doctor?.doctor_name || res.consultation.doctor?.name || t("video.doctor");
        setState({
          phase: "ready",
          info: {
            consultationId: res.consultation.id,
            roomToken: res.roomToken,
            doctorName,
            doctorDepartment: res.consultation.doctor?.department || null,
            patientName: res.consultation.patient_name,
            scheduledStart: res.consultation.scheduled_start,
            initialStatus: res.consultation.status,
          },
        });
      })
      .catch((e: any) => {
        if (e?.status === 401) {
          setState({ phase: "unauthenticated" });
        } else if (e?.status === 403) {
          setState({ phase: "not-joinable", reason: "permission" });
        } else {
          setState({ phase: "error", message: e?.message || t("video.loadFailed") });
        }
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
          <p className="text-sm text-slate-400 mb-8">{t("video.signInToJoin")}</p>
          <button
            onClick={() => router.push("/portal/login")}
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
          <p className="text-sm text-slate-400 mb-8">{t("video.notJoinableReason")}</p>
          <button
            onClick={() => router.push("/portal")}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            {t("video.backToPortal")}
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
            onClick={() => router.push("/portal")}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            {t("video.backToPortal")}
          </button>
        </div>
      </div>
    );
  }

  // exited state after call ends
  if (exited) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("video.callEnded")}</h1>
          <p className="text-slate-400 text-sm mb-8">{t("video.endedThanks")}</p>
          <button
            onClick={() => router.push("/portal")}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            {t("video.backToPortal")}
          </button>
        </div>
      </div>
    );
  }

  const info = state.info;
  const displayName = info.patientName || t("video.patient");

  return (
    <VideoRoom
      role="patient"
      info={info}
      displayName={displayName}
      onStatusChange={async (status) => {
        if (["in_call", "completed", "cancelled"].includes(status)) {
          try {
            await fetch(`/api/portal/consultations/${info.consultationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
          } catch {
            /* best effort */
          }
        }
      }}
      onComplete={() => setExited(true)}
      onExit={() => router.push("/portal")}
    />
  );
}
