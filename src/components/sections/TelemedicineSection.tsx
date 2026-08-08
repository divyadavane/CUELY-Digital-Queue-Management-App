'use client';

import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  MonitorCheck,
  ClipboardPlus,
  CreditCard,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { TELEMEDICINE_HIGHLIGHTS } from '@/lib/landing-data';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { GradientText } from '@/components/ui/GradientText';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

const highlightIconMap: Record<string, React.ElementType> = {
  Radio,
  MonitorCheck,
  ClipboardPlus,
  CreditCard,
};

export function TelemedicineSection() {
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => (prev + 1) % 3600);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <section id="telemedicine" className="py-24 relative overflow-hidden">
      {/* Background Violet Glow */}
      <div className="pointer-events-none absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[150px] -z-10" />
      <div className="pointer-events-none absolute bottom-1/4 left-0 h-[350px] w-[350px] rounded-full bg-blue-600/8 blur-[120px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-400 mb-6 shadow-sm">
              <CuelyLogo size="xs" showGlow />
              <span>Telemedicine Built-In</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Video Consults,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400">
                Zero Dependencies
              </span>
            </h2>

            <p className="mt-5 text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Peer-to-peer WebRTC video calls run directly in the browser. No Twilio, no LiveKit, no
              third-party SFU — just a reliable, low-latency connection between doctor and patient.
            </p>

            {/* Feature highlights */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {TELEMEDICINE_HIGHLIGHTS.map((item, idx) => {
                const Icon = highlightIconMap[item.iconName] || Radio;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-300"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                      <Icon className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RevealOnScroll>

          {/* Right — Video Call UI Mockup */}
          <RevealOnScroll>
            <CardContainer className="inter-var">
              <CardBody className="relative group/card rounded-3xl border border-white/15 bg-gradient-to-b from-[#151c2e]/95 to-[#0b101d]/95 p-5 shadow-2xl backdrop-blur-2xl hover:shadow-2xl hover:shadow-violet-500/[0.2] transition-all duration-300 w-full h-auto">
                
                {/* Ambient glow behind mockup */}
                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-violet-600/20 via-purple-600/15 to-fuchsia-500/10 blur-2xl -z-10 pointer-events-none" />

                {/* Video call header */}
                <CardItem translateZ="30" className="w-full flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <CuelyLogo size="xs" showGlow />
                    <span className="text-sm font-bold text-white">Cuely Meet</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-[10px] text-emerald-400 font-mono font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE • {formatTime(callDuration)}
                  </div>
                </CardItem>

                {/* Video area (simulated) */}
                <CardItem translateZ="60" className="w-full relative rounded-2xl bg-gradient-to-br from-violet-900/30 via-[#1a1030] to-[#0d0620] border border-white/5 aspect-video flex items-center justify-center overflow-hidden">
                  {/* Simulated doctor avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-500/25">
                      Dr
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">Dr. Sarah Jenkins</p>
                      <p className="text-xs text-white/40">General Consultation</p>
                    </div>
                  </div>

                  {/* Mini self-view */}
                  <div className="absolute bottom-3 right-3 h-16 w-24 rounded-lg bg-[#1a1a2e] border border-white/10 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                      You
                    </div>
                  </div>

                  {/* Connection quality badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-[9px] text-emerald-400 font-mono">
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    HD • 24ms
                  </div>
                </CardItem>

                {/* Call controls */}
                <CardItem translateZ="40" className="w-full flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/5">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors pointer-events-auto">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors pointer-events-auto">
                    <Video className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors pointer-events-auto">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors pointer-events-auto">
                    <FileText className="h-4 w-4" />
                  </button>
                  <button className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/25 pointer-events-auto">
                    <PhoneOff className="h-4 w-4" />
                  </button>
                </CardItem>

                {/* In-call mini ticket */}
                <CardItem translateZ="50" className="w-full mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                      <CheckCircle2 className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Token A-204</p>
                      <p className="text-[10px] text-white/40">Video Consultation in progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <Clock className="h-3 w-3" />
                    {formatTime(callDuration)}
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
