'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '@/lib/landing-data';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { GradientText } from '@/components/ui/GradientText';
import { GlowCard } from '@/components/ui/GlowCard';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-4 shadow-sm">
            <CuelyLogo size="xs" showGlow />
            <span>4-Step Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How Cuely <GradientText>Transforms Your Lobby</GradientText>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Deploy in minutes with zero software downloads required for staff or visitors.
          </p>
        </RevealOnScroll>

        {/* 4-Step Container with Connecting Dashed Line */}
        <div className="relative">
          {/* Horizontal Connecting Dashed Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-px border-t-2 border-dashed border-white/20 -translate-y-1/2 z-0" />

          <RevealOnScroll stagger className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <GlowCard key={step.number} className="h-full flex flex-col justify-between relative bg-[#0a0e17]/80 backdrop-blur-xl" glowColor="rgba(59, 130, 246, 0.2)">
                <div>
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-lg font-extrabold text-white font-mono shadow-lg shadow-blue-500/25 relative z-10">
                      {step.number}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono flex items-center gap-1">
                      <CuelyLogo size="xs" showGlow={false} />
                      Step {idx + 1} of 4
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                    {step.description}
                  </p>

                  {/* Bullet details */}
                  <ul className="space-y-2.5 pt-4 border-t border-white/5">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-2 text-[11px] text-white/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlowCard>
            ))}
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
