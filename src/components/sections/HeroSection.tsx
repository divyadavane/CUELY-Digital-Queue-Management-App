'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Users, CheckCircle2, Clock, Smartphone, Play } from 'lucide-react';
import { LANDING_CONFIG } from '@/lib/landing-data';
import { GradientText } from '@/components/ui/GradientText';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TiltCard } from '@/components/ui/TiltCard';
import { CuelyLogo } from '@/components/ui/CuelyLogo';
import LetterHoverEffect from '@/components/ui/scale-letter';
import { heroBadgeVariant, floatAnimation, glowPulseAnimation } from '@/lib/motion';

export function HeroSection() {
  const [tokenNum, setTokenNum] = useState('A-104');
  const [status, setStatus] = useState<'WAITING' | 'ALMOST' | 'CALLED' | 'SERVED'>('WAITING');
  const [position, setPosition] = useState(2);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Live simulation ticker for the ticket mockup
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((prev) => {
        if (prev === 'WAITING') {
          setPosition(1);
          return 'ALMOST';
        }
        if (prev === 'ALMOST') {
          setPosition(0);
          return 'CALLED';
        }
        if (prev === 'CALLED') {
          return 'SERVED';
        }
        // Reset after SERVED
        setPosition(Math.floor(Math.random() * 3 + 2));
        setTokenNum(`A-${Math.floor(Math.random() * 800 + 100)}`);
        return 'WAITING';
      });
    }, 4000); // Realistic 4s intervals
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-cyan-500/15 blur-[130px] -z-10" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-[100px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Eyebrow Badge with Prominent Cuely Logo */}
            <motion.div
              variants={prefersReducedMotion ? {} : heroBadgeVariant}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-3 rounded-full border border-blue-500/40 bg-blue-500/15 px-4 py-2 text-xs font-bold text-blue-300 backdrop-blur-md mb-6 shadow-md shadow-blue-500/20"
            >
              <CuelyLogo size="xs" showGlow />
              <span className="text-[var(--text-primary)] font-extrabold">{LANDING_CONFIG.badgeText}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-blue-300 font-medium">Next Gen Queue Engine</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1]"
            >
              {LANDING_CONFIG.heroHeadline}
              <LetterHoverEffect 
                text={LANDING_CONFIG.heroAccentPhrase} 
                textClassName="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 animate-gradient-shimmer"
              />
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal"
            >
              {LANDING_CONFIG.heroSubheadline}
            </motion.p>

            {/* Dual Magnetic CTAs */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link href={LANDING_CONFIG.primaryCtaHref}>
                <MagneticButton variant="primary" className="w-full sm:w-auto text-base px-8 py-4">
                  <span>{LANDING_CONFIG.primaryCtaText}</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </MagneticButton>
              </Link>
              <Link href={LANDING_CONFIG.secondaryCtaHref}>
                <MagneticButton variant="secondary" className="w-full sm:w-auto text-base px-8 py-4">
                  <Play className="h-4 w-4 fill-[var(--text-primary)] text-[var(--text-primary)]" />
                  <span className="text-[var(--text-primary)]">{LANDING_CONFIG.secondaryCtaText}</span>
                </MagneticButton>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex items-center justify-center lg:justify-start gap-4 pt-6 border-t border-[var(--border-color)]"
            >
              <div className="flex -space-x-3 overflow-hidden">
                {LANDING_CONFIG.socialProof.avatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="User Avatar"
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-[#0a0e17] object-cover"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                  ))}
                  <span className="text-xs font-semibold text-[var(--text-primary)] ml-1">4.9/5</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  {LANDING_CONFIG.socialProof.businessCount}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Floating 3D Tilt Device Mockup */}
          <div className="lg:col-span-5 relative flex justify-center mt-12 lg:mt-0">
            {/* Ambient Background Glow behind device */}
            {!prefersReducedMotion && (
              <motion.div
                animate={glowPulseAnimation}
                className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-600/30 via-indigo-600/30 to-cyan-500/20 blur-2xl -z-10"
              />
            )}

            <motion.div animate={prefersReducedMotion ? {} : floatAnimation} className="w-full max-w-sm sm:max-w-md">
              <TiltCard maxTilt={12}>
                <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-[#151c2e]/90 to-[#0b101d]/90 p-6 shadow-2xl backdrop-blur-2xl">
                  {/* Phone Notch/Header bar with Prominent Cuely Logo */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <CuelyLogo size="sm" showGlow />
                      <span className="text-base font-black text-white tracking-tight">Cuely OS</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[11px] text-blue-300 font-mono">
                      <span className={`h-2 w-2 rounded-full bg-emerald-400 ${prefersReducedMotion ? '' : 'animate-ping'}`} />
                      LIVE TICKET
                    </div>
                  </div>

                  {/* Ticket Content */}
                  <div className={`relative rounded-2xl border ${status === 'CALLED' ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(52,211,153,0.3)] bg-gradient-to-b from-emerald-500/10 to-transparent' : 'border-white/10 bg-gradient-to-b from-white/5 to-white/0'} p-6 text-center shadow-inner transition-all duration-500`}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center justify-center gap-1.5 mb-2">
                      <CuelyLogo size="xs" showGlow={false} />
                      <span>General Consultation</span>
                    </div>
                    
                    <div className="my-6">
                      <span className="text-6xl font-black tracking-tight text-white font-mono drop-shadow-md">
                        {tokenNum}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wider mb-8 border shadow-sm transition-colors duration-500
                      ${status === 'WAITING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        status === 'ALMOST' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        status === 'CALLED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          status === 'WAITING' ? 'bg-amber-400' :
                          status === 'ALMOST' ? 'bg-orange-400 animate-pulse' :
                          status === 'CALLED' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' :
                          'bg-blue-400'
                        }`}
                      />
                      <span>STATUS: {status}</span>
                    </div>

                    {/* Queue Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-left">
                      <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
                          <Users className="h-3.5 w-3.5 text-blue-400" />
                          <span>Ahead of you</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white font-mono">{position} <span className="text-sm font-sans font-normal text-white/50">people</span></p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
                          <Clock className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Est. Wait</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white font-mono">
                          {position * 4} <span className="text-sm font-sans font-normal text-white/50">mins</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Notification Simulation */}
                  <div className={`mt-4 flex items-center justify-between rounded-xl border p-3 text-xs transition-colors duration-500
                    ${status === 'CALLED' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                    <div className="flex items-center gap-2">
                      <Smartphone className={`h-4 w-4 ${status === 'CALLED' ? 'text-emerald-400' : 'text-blue-400'}`} />
                      <span>
                        {status === 'CALLED' ? 'Please proceed to Counter 3' : 'WhatsApp alert will notify when called'}
                      </span>
                    </div>
                    <CheckCircle2 className={`h-4 w-4 ${status === 'CALLED' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
