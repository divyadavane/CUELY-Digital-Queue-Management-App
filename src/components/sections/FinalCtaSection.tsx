'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { LANDING_CONFIG } from '@/lib/landing-data';
import { GradientText } from '@/components/ui/GradientText';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

export function FinalCtaSection() {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background Gradient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-blue-600/20 via-indigo-600/30 to-cyan-500/20 blur-[140px] -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <RevealOnScroll className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/5 p-8 sm:p-16 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          {/* Subtle Shimmer Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/20 to-cyan-500/10 opacity-50" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Prominent Cuely Logo & Badge */}
            <div className="inline-flex items-center gap-3 rounded-full border border-blue-400/40 bg-blue-400/15 px-5 py-2 text-xs font-bold text-blue-300 mb-8 shadow-md shadow-blue-500/20">
              <CuelyLogo size="sm" showGlow />
              <span className="text-white font-extrabold">Ready to transform your lobby?</span>
            </div>

            <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Start Managing Queues <br />
              <GradientText>Like a Pro Today</GradientText>
            </h2>

            <p className="mt-6 text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-normal">
              Join 2,400+ modern clinics, banks, and retail locations using Cuely to deliver frictionless visitor experiences.
            </p>

            {/* Dual CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <Link href={LANDING_CONFIG.primaryCtaHref}>
                <MagneticButton variant="primary" className="w-full sm:w-auto text-base px-9 py-4">
                  <span>{LANDING_CONFIG.primaryCtaText}</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </MagneticButton>
              </Link>
              <Link href={LANDING_CONFIG.secondaryCtaHref}>
                <MagneticButton variant="secondary" className="w-full sm:w-auto text-base px-9 py-4">
                  <span>{LANDING_CONFIG.secondaryCtaText}</span>
                </MagneticButton>
              </Link>
            </div>

            {/* Guarantees & Social Proof */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-white/10 text-xs font-medium text-white/70 w-full">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Instant 5-minute setup</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
