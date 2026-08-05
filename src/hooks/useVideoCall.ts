"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export type VideoRole = "doctor" | "patient";
export type ConnectionQuality = "excellent" | "good" | "poor" | "unknown";

export interface RoomPeer {
  role: VideoRole;
  name: string;
}

interface UseVideoCallOptions {
  consultationId: string;
  roomToken: string;
  role: VideoRole;
  displayName: string;
  initialStream?: MediaStream | null;
}

export interface VideoCallState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  peers: RoomPeer[];
  quality: ConnectionQuality;
  cameraOn: boolean;
  micOn: boolean;
  screenSharing: boolean;
  error: string | null;
  joined: boolean;
  elapsedSeconds: number;
  join: () => Promise<void>;
  leave: () => void;
  toggleCamera: () => void;
  toggleMic: () => void;
  switchCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:openrelay.metered.ca:80" },
];

function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [...STUN_SERVERS];
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (turnUrl && turnUsername && turnCredential) {
    servers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
  }
  return servers;
}

export function useVideoCall({
  consultationId,
  roomToken,
  role,
  displayName,
  initialStream,
}: UseVideoCallOptions): VideoCallState {
  const supabaseRef = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const gotRemoteRef = useRef(false);
  const negotiatingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const joiningRef = useRef(false);
  const joinedRef = useRef(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [quality, setQuality] = useState<ConnectionQuality>("unknown");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startedAtRef = useRef<number | null>(null);

  // ---- Timer for consultation duration ----
  useEffect(() => {
    if (connectionState !== "connected") return;
    if (!startedAtRef.current) startedAtRef.current = Date.now();
    const interval = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionState]);

  // ---- Quality sampling ----
  useEffect(() => {
    if (connectionState !== "connected") return;
    const interval = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        const stats = await pc.getStats();
        let rtt: number | null = null;
        stats.forEach((report: any) => {
          if (report.type === "candidate-pair" && report.state === "succeeded" && report.currentRoundTripTime != null) {
            rtt = report.currentRoundTripTime * 1000;
          }
        });
        if (rtt == null) {
          setQuality("unknown");
        } else if (rtt < 150) {
          setQuality("excellent");
        } else if (rtt < 400) {
          setQuality("good");
        } else {
          setQuality("poor");
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [connectionState]);

  const sendSignal = useCallback(
    (payload: unknown) => {
      const channel = channelRef.current;
      if (!channel) return;
      channel.send({ type: "broadcast", event: "signal", payload });
    },
    []
  );

  const ensureLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current) return localStreamRef.current;
    // Reuse the waiting-room preview stream so the call doesn't re-acquire the
    // camera (re-acquiring right after release can return a blank/black track).
    if (
      initialStream &&
      initialStream.getTracks().some((t) => t.readyState === "live")
    ) {
      localStreamRef.current = initialStream;
      setLocalStream(initialStream);
      return initialStream;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [initialStream]);

  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ type: "ice", candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = (event) => {
        gotRemoteRef.current = true;
        setRemoteStream(event.streams[0] || null);
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === "failed") {
          attemptReconnect();
        }
        if (pc.connectionState === "connected") {
          reconnectAttemptsRef.current = 0;
        }
      };

      pc.onnegotiationneeded = async () => {
        // Only the patient initiates the initial offer; renegotiation for
        // screen share is driven explicitly by the doctor. Ignore automatic
        // renegotiation events to avoid glare.
        if (gotRemoteRef.current) return;
        if (role === "patient") {
          await maybeSendOffer();
        }
      };

      if (pc.remoteDescription && pendingCandidatesRef.current.length > 0) {
        pendingCandidatesRef.current.forEach((c) => pc.addIceCandidate(c).catch(() => {}));
        pendingCandidatesRef.current = [];
      }

      return pc;
    },
    [role, sendSignal]
  );

  const maybeSendOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || negotiatingRef.current) return;
    if (pc.signalingState !== "stable") return;
    negotiatingRef.current = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: "offer", sdp: pc.localDescription });
    } catch {
      /* ignore */
    } finally {
      negotiatingRef.current = false;
    }
  }, [sendSignal]);

  const handleSignal = useCallback(
    async (payload: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      const type = payload?.type;

      if (type === "offer") {
        // Doctor (or the receiving party) answers. Glare is avoided by only
        // the patient offering the initial call.
        if (pc.signalingState !== "stable") return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: payload.sdp }));
          pendingCandidatesRef.current.forEach((c) => pc.addIceCandidate(c).catch(() => {}));
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: "answer", sdp: pc.localDescription });
        } catch {
          /* ignore */
        }
      } else if (type === "answer") {
        if (pc.signalingState === "have-local-offer") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: payload.sdp }));
          } catch {
            /* ignore */
          }
        }
      } else if (type === "ice") {
        const candidate = payload.candidate as RTCIceCandidateInit;
        if (pc.remoteDescription) {
          pc.addIceCandidate(candidate).catch(() => {});
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      }
    },
    [sendSignal]
  );

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= 4) return;
    reconnectAttemptsRef.current += 1;
    const stream = localStreamRef.current;
    if (!stream || !channelRef.current) return;
    setTimeout(() => {
      createPeerConnection(stream);
      if (role === "patient") maybeSendOffer();
    }, 1200 * reconnectAttemptsRef.current);
  }, [createPeerConnection, maybeSendOffer, role]);

  const join = useCallback(async () => {
    // Guard against duplicate invocation (e.g. React StrictMode double-effects
    // in dev, which would re-add presence callbacks on an already-subscribed
    // Supabase channel and break the signaling). The flag must NOT be reset by
    // the unmount cleanup, or StrictMode would let the second call through.
    if (joinedRef.current || joiningRef.current) return;
    joiningRef.current = true;
    try {
      // Tear down any previously created channel for this room so callbacks
      // are always registered on a fresh, unsubscribed channel.
      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {});
        channelRef.current.unsubscribe().catch(() => {});
        channelRef.current = null;
      }

      const stream = await ensureLocalStream();
      createPeerConnection(stream);

      const channel: RealtimeChannel = supabaseRef.current.channel(`video:${roomToken}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "signal" }, (message: any) => {
          handleSignal(message.payload);
        })
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState() as unknown as Record<string, RoomPeer[]>;
          setPeers(Object.values(state).flat());
        });

      channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({ role, name: displayName }).catch(() => {});
        setJoined(true);
        joinedRef.current = true;
        // Patient drives the initial offer once both peers are present.
        if (role === "patient") {
          const hasOther = Object.keys(channel.presenceState()).length >= 2;
          if (hasOther) maybeSendOffer();
        }
      });

      channelRef.current = channel;
    } catch (e: any) {
      setError(e?.message || "Could not access camera or microphone");
    } finally {
      joiningRef.current = false;
    }
  }, [roomToken, role, displayName, ensureLocalStream, createPeerConnection, handleSignal, maybeSendOffer]);

  // Re-send the offer when the doctor's presence arrives while we wait.
  useEffect(() => {
    if (!joined || role !== "patient" || gotRemoteRef.current) return;
    const hasOther = peers.length >= 2;
    if (hasOther) maybeSendOffer();
  }, [peers, joined, role, maybeSendOffer]);

  const leave = useCallback(() => {
    channelRef.current?.untrack().catch(() => {});
    channelRef.current?.unsubscribe().catch(() => {});
    channelRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setJoined(false);
    setPeers([]);
    setConnectionState("closed");
    gotRemoteRef.current = false;
    joinedRef.current = false;
    joiningRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      channelRef.current?.untrack().catch(() => {});
      channelRef.current?.unsubscribe().catch(() => {});
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCameraOn(stream.getVideoTracks().every((t) => t.enabled) || stream.getVideoTracks().length === 0);
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicOn(stream.getAudioTracks().every((t) => t.enabled) || stream.getAudioTracks().length === 0);
  }, []);

  const switchCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    const settings = videoTrack.getSettings();
    const nextFacing = settings.facingMode === "environment" ? "user" : "environment";
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: nextFacing },
      audio: false,
    });
    const newTrack = newStream.getVideoTracks()[0];
    const pc = pcRef.current;
    if (pc) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(newTrack).catch(() => {});
    }
    stream.removeTrack(videoTrack);
    videoTrack.stop();
    stream.addTrack(newTrack);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    if (screenStreamRef.current) {
      // Stop sharing: restore the camera video track.
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0] || null;
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(cameraTrack).catch(() => {});
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setScreenSharing(false);
      await maybeSendOffer();
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const displayTrack = displayStream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(displayTrack).catch(() => {});
      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setScreenSharing(true);
      displayTrack.onended = () => toggleScreenShare();
      await maybeSendOffer();
    } catch {
      /* user cancelled picker */
    }
  }, [maybeSendOffer]);

  return {
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
  };
}
