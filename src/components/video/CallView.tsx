"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  Maximize,
  Minimize,
  PictureInPicture2,
  RefreshCcw,
  MonitorUp,
  MonitorOff,
  Users,
  Stethoscope,
  ClipboardList,
  X,
  Loader2,
} from "lucide-react";
import { useVideoCall, ConnectionQuality } from "@/hooks/useVideoCall";
import { DoctorPanel } from "./DoctorPanel";

interface CallViewProps {
  role: "doctor" | "patient";
  consultationId: string;
  roomToken: string;
  displayName: string;
  doctorName: string;
  patientName: string | null;
  initialStream?: MediaStream | null;
  onStatusChange: (status: string) => void;
  onComplete: () => void;
  onLeave: () => void;
  onExit: () => void;
  isDoctorPanelEnabled?: boolean;
}

function VideoTile({
  stream,
  mirrored,
  muted,
  label,
  compact,
}: {
  stream: MediaStream | null;
  mirrored?: boolean;
  muted?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    const play = () => el.play().catch(() => {});
    play();
    el.addEventListener("loadeddata", play);
    return () => el.removeEventListener("loadeddata", play);
  }, [stream]);

  useEffect(() => {
    if (stream) {
      console.debug("[video-debug] VideoTile render", {
        label,
        streamId: stream.id,
        tracks: stream.getTracks().map((t) => `${t.kind}:${t.readyState}`),
      });
    } else {
      console.debug("[video-debug] VideoTile render (no stream)", { label });
    }
  }, [stream, label]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-black ${compact ? "" : "w-full h-full"}`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          onPlaying={() => console.debug("[video-debug] video playing", { label, streamId: stream.id })}
          onError={(e) => console.debug("[video-debug] video error", { label, error: e.currentTarget.error })}
          className={`w-full h-full object-cover ${mirrored ? "-scale-x-100" : ""}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
          <CameraOff className="w-8 h-8" />
          <span className="text-[10px] font-bold">{label}</span>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-white">
          {label}
        </div>
      )}
    </div>
  );
}

function QualityBadge({ quality }: { quality: ConnectionQuality }) {
  const { t } = useTranslation();
  if (quality === "unknown") return null;
  const map: Record<ConnectionQuality, { color: string; label: string }> = {
    excellent: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: t("video.qualityExcellent") },
    good: { color: "bg-lime-500/20 text-lime-300 border-lime-500/30", label: t("video.qualityGood") },
    poor: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: t("video.qualityPoor") },
    unknown: { color: "bg-slate-500/20 text-slate-300 border-slate-500/30", label: t("video.qualityUnknown") },
  };
  const cfg = map[quality];
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {cfg.label}
    </span>
  );
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function CallView({
  role,
  consultationId,
  roomToken,
  displayName,
  doctorName,
  patientName,
  initialStream,
  onStatusChange,
  onComplete,
  onLeave,
  onExit,
  isDoctorPanelEnabled = false,
}: CallViewProps) {
  const { t } = useTranslation();
  const isPatient = role === "patient";
  const {
    localStream,
    remoteStream,
    screenStream,
    connectionState,
    peers,
    quality,
    cameraOn,
    micOn,
    screenSharing,
    error,
    joined,
    elapsedSeconds,
    join,
    leave,
    toggleCamera,
    toggleMic,
    switchCamera,
    toggleScreenShare,
  } = useVideoCall({ consultationId, roomToken, role, displayName, initialStream });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [pressingEnd, setPressingEnd] = useState(false);
  const statusReportedRef = useRef(false);

  useEffect(() => {
    join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report in_call once a live media connection is established.
  useEffect(() => {
    if (connectionState === "connected" && !statusReportedRef.current) {
      statusReportedRef.current = true;
      onStatusChange("in_call");
    }
  }, [connectionState, onStatusChange]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  const togglePip = useCallback(async () => {
    const video = document.querySelector<HTMLVideoElement>("#cuely-remote-video");
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ((video as any).requestPictureInPicture) {
        await (video as any).requestPictureInPicture();
      }
    } catch {
      /* PiP unsupported */
    }
  }, []);

  const connected = connectionState === "connected";
  const connecting = connectionState === "connecting" || connectionState === "new";
  const reconnecting = connectionState === "disconnected" || connectionState === "failed";
  const otherPeers = peers.filter((p) => p.role !== role).length;

  // Doctor's screen share shows on the doctor's own main tile; on the
  // patient side it arrives over the remote stream. Main tile = the other
  // person; self always stays in the small corner PIP (standard video-call
  // layout).
  const mainStream = isPatient
    ? remoteStream
    : screenSharing
      ? screenStream
      : remoteStream;
  const mainLabel = isPatient
    ? doctorName
    : screenSharing
      ? t("video.yourScreen")
      : patientName || t("video.patient");
  const sideStream = localStream;
  const sideLabel = isPatient ? t("video.you") : t("video.youDoctor");
  const sideMirrored = true;

  const handleEnd = () => {
    setPressingEnd(true);
  };

  const confirmEnd = () => {
    leave();
    if (isPatient) {
      onLeave();
    } else {
      onComplete();
    }
  };

  return (
    <div ref={containerRef} className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{isPatient ? doctorName : t("video.consultWith", { patient: patientName || t("video.patient") })}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {connected
                ? t("video.inCall")
                : connecting
                  ? t("video.connecting")
                  : reconnecting
                    ? t("video.reconnecting")
                    : t("video.waitingToConnect")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reconnecting && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <RefreshCcw className="w-3 h-3 animate-spin" />
              {t("video.reconnecting")}
            </span>
          )}
          <QualityBadge quality={quality} />
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full tabular-nums">
            <Users className="w-3 h-3" />
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Main stage */}
      <div className="flex-1 flex min-h-0 p-3 gap-3">
        <div className="relative flex-1 min-w-0">
          <VideoTile stream={mainStream} label={mainLabel} muted={false} />

          {/* Side preview (self view) */}
          <div className="absolute top-3 right-3 w-56 aspect-video rounded-xl overflow-hidden border-2 border-blue-400 shadow-xl z-10 hidden sm:block">
            <VideoTile stream={sideStream} mirrored={sideMirrored} muted label={sideLabel} compact />
          </div>

          {/* Waiting overlay when no remote media */}
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">
                  {connecting
                    ? t("video.waitingForPeer")
                    : reconnecting
                      ? t("video.reconnecting")
                      : otherPeers > 0
                        ? t("video.connecting")
                        : isPatient
                          ? t("video.waitingForDoctor")
                          : t("video.waitingForPatient")}
                </p>
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Mobile self-view */}
        <div className="sm:hidden absolute bottom-20 right-3 w-40 aspect-video rounded-xl overflow-hidden border-2 border-blue-400 shadow-xl z-10">
          <VideoTile stream={sideStream} mirrored={sideMirrored} muted label={sideLabel} compact />
        </div>

        {/* Doctor panel (SOAP + prescription) */}
        {isDoctorPanelEnabled && showPanel && (
          <div className="w-80 border border-white/10 rounded-2xl overflow-hidden bg-slate-900 shrink-0 flex flex-col hidden lg:flex">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                {t("video.consultationPanel")}
              </span>
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <DoctorPanel consultationId={consultationId} />
            </div>
          </div>
        )}

        {/* Mobile panel drawer */}
        {isDoctorPanelEnabled && showPanel && (
          <div className="lg:hidden absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                {t("video.consultationPanel")}
              </span>
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <DoctorPanel consultationId={consultationId} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 px-4 py-3 border-t border-white/10 bg-slate-950/90">
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <ControlButton active={micOn} onClick={toggleMic} label={t("video.mic")} danger={!micOn}>
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </ControlButton>
          <ControlButton active={cameraOn} onClick={toggleCamera} label={t("video.camera")} danger={!cameraOn}>
            {cameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </ControlButton>

          {isPatient && (
            <ControlButton active onClick={switchCamera} label={t("video.flipCamera")}>
              <RefreshCcw className="w-5 h-5" />
            </ControlButton>
          )}

          {!isPatient && (
            <ControlButton active={screenSharing} onClick={toggleScreenShare} label={t("video.shareScreen")}>
              {screenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
            </ControlButton>
          )}

          {isDoctorPanelEnabled && (
            <ControlButton active={showPanel} onClick={() => setShowPanel((v) => !v)} label={t("video.panel")}>
              <ClipboardList className="w-5 h-5" />
            </ControlButton>
          )}

          <ControlButton active onClick={toggleFullscreen} label={t("video.fullscreen")}>
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </ControlButton>
          <ControlButton active onClick={togglePip} label={t("video.pictureInPicture")}>
            <PictureInPicture2 className="w-5 h-5" />
          </ControlButton>

          <ControlButton
            active={false}
            onClick={handleEnd}
            label={t("video.end")}
            danger
            className="!bg-red-600 !border-red-500/40 hover:!bg-red-500 !text-white"
          >
            <PhoneOff className="w-5 h-5" />
          </ControlButton>
        </div>

        {pressingEnd && (
          <div className="flex items-center justify-center gap-3 mt-3 animate-in fade-in">
            <p className="text-sm text-slate-300">{t("video.confirmEnd")}</p>
            <button onClick={confirmEnd} className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold">
              {t("video.yesEnd")}
            </button>
            <button onClick={() => setPressingEnd(false)} className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold">
              {t("video.cancel")}
            </button>
          </div>
        )}
      </div>

      {/* TEMP debug bar */}
      <div className="shrink-0 px-3 py-1 bg-slate-900 border-t border-white/10 text-[10px] font-mono text-emerald-300 flex flex-wrap gap-x-3 gap-y-0.5">
        <span>role:{role}</span>
        <span>pc:{connectionState}</span>
        <span>joined:{String(joined)}</span>
        <span>peers:{peers.length}</span>
        <span>local:{localStream ? (localStream.getVideoTracks().some((t) => t.readyState === "live") ? "video:live" : "video:dead") : "none"}</span>
        <span>remote:{remoteStream ? "yes" : "no"}</span>
      </div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  label,
  danger,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative flex flex-col items-center justify-center gap-1 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border text-xs font-bold transition-all group ${
        danger
          ? "border-white/10 bg-white/5 text-slate-300"
          : active
            ? "border-white/10 bg-white/5 text-white"
            : "border-red-500/30 bg-red-500/15 text-red-400"
      } ${className || ""}`}
    >
      {children}
    </button>
  );
}
