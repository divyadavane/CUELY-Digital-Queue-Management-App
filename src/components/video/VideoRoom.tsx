"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { WaitingRoom } from "./WaitingRoom";
import { CallView } from "./CallView";
import { Loader2 } from "lucide-react";

export interface VideoParticipantInfo {
  consultationId: string;
  roomToken: string;
  doctorName: string;
  doctorDepartment: string | null;
  patientName: string | null;
  scheduledStart: string;
  initialStatus: string;
}

export type VideoRoomPhase = "waiting" | "call" | "ended";

interface VideoRoomProps {
  role: "doctor" | "patient";
  info: VideoParticipantInfo;
  displayName: string;
  onExit: () => void;
  onStatusChange?: (status: string) => void;
  onComplete?: () => void;
  isDoctorPanelEnabled?: boolean;
}

export function VideoRoom({
  role,
  info,
  displayName,
  onExit,
  onStatusChange,
  onComplete,
  isDoctorPanelEnabled = false,
}: VideoRoomProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<VideoRoomPhase>("waiting");
  const [localStatus, setLocalStatus] = useState(info.initialStatus);
  const [endedReason, setEndedReason] = useState<string | null>(null);
  const [handoffStream, setHandoffStream] = useState<MediaStream | null>(null);

  const isPatient = role === "patient";

  const currentStatus = localStatus;

  const handleStatusChange = (status: string) => {
    setLocalStatus(status);
    onStatusChange?.(status);
  };

  const handleEnded = (reason: string) => {
    setEndedReason(reason);
    setPhase("ended");
    onComplete?.();
  };

  const peerName = isPatient ? info.doctorName : info.patientName || "Patient";

  const title = useMemo(() => {
    if (phase === "waiting") {
      return isPatient ? t("video.waitingRoom") : t("video.doctorWaitingRoom");
    }
    if (phase === "call") return t("video.inCall");
    return t("video.callEnded");
  }, [phase, isPatient, t]);

  if (phase === "waiting") {
    return (
      <WaitingRoom
        isPatient={isPatient}
        doctorName={info.doctorName}
        doctorDepartment={info.doctorDepartment}
        patientName={info.patientName}
        scheduledStart={info.scheduledStart}
        status={currentStatus}
        onJoin={(stream) => {
          if (stream) setHandoffStream(stream);
          if (!isPatient && currentStatus === "scheduled") {
            handleStatusChange("ready");
          }
          setPhase("call");
        }}
      />
    );
  }

  if (phase === "call") {
    return (
      <CallView
        role={role}
        consultationId={info.consultationId}
        roomToken={info.roomToken}
        displayName={displayName}
        doctorName={info.doctorName}
        patientName={info.patientName}
        initialStream={handoffStream}
        onStatusChange={handleStatusChange}
        onComplete={() => handleEnded("completed")}
        onLeave={() => handleEnded("left")}
        onExit={onExit}
        isDoctorPanelEnabled={isDoctorPanelEnabled}
      />
    );
  }

  // ended
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-slate-400 text-sm mb-8">
          {endedReason === "completed"
            ? t("video.endedComplete", { doctor: info.doctorName })
            : t("video.endedLeft", { doctor: peerName })}
        </p>
        <button
          onClick={onExit}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
        >
          {isPatient ? t("video.backToPortal") : t("video.backToDashboard")}
        </button>
      </div>
    </div>
  );
}
