'use client';

import React from 'react';
import { CLIENT_LOGOS } from '@/lib/landing-data';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

export function LogoMarqueeSection() {
  // Duplicate array for seamless infinite marquee loop
  const logos = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

  return (
    <section className="py-12 border-y border-[var(--border-color)] bg-[var(--stat-strip-bg)] overflow-hidden relative">
      {/* Gradient Mask Edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center justify-center gap-2">
          <CuelyLogo size="xs" showGlow />
          <span>Trusted by 2,400+ leading healthcare centers, enterprise banks & retail chains</span>
        </div>
      </div>

      <div className="flex overflow-hidden group">
        <div className="flex min-w-full shrink-0 items-center justify-around gap-12 animate-marquee group-hover:[animation-play-state:paused]">
          {logos.map((logo, idx) => (
            <div
              key={`${logo.id}-${idx}`}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-blue-500/30 transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-sm"
              data-cursor="hover"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-black text-blue-500 font-mono border border-blue-500/20">
                {logo.logoText[0]}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold tracking-wider text-[var(--text-primary)] font-mono">
                  {logo.logoText}
                </span>
                <span className="text-[9px] tracking-widest text-[var(--text-secondary)] uppercase font-semibold">
                  {logo.subtext}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </section>
  );
}
