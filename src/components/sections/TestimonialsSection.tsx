'use client';

import React from 'react';
import { Star, Quote, TrendingUp } from 'lucide-react';
import { TESTIMONIALS_DATA } from '@/lib/landing-data';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { TiltCard } from '@/components/ui/TiltCard';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { GradientText } from '@/components/ui/GradientText';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-4 shadow-sm">
            <CuelyLogo size="xs" showGlow />
            <span>Customer Stories</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Loved by Teams <GradientText>Worldwide</GradientText>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            See how operations leaders use Cuely to create world-class visitor experiences.
          </p>
        </RevealOnScroll>

        <RevealOnScroll stagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS_DATA.map((t) => (
            <TiltCard key={t.id} maxTilt={6}>
              <SpotlightCard
                spotlightColor="rgba(6, 182, 212, 0.15)"
                borderColor="rgba(6, 182, 212, 0.3)"
                className="h-full flex flex-col justify-between"
              >
                <div>
                  {/* Rating Stars & Metric */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>{t.metric}</span>
                    </div>
                  </div>

                  <Quote className="h-8 w-8 text-white/20 mb-3" />

                  <p className="text-base text-white/90 leading-relaxed italic font-normal">
                    "{t.quote}"
                  </p>
                </div>

                {/* Author Metadata */}
                <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-3">
                  <img
                    src={t.avatarUrl}
                    alt={t.author}
                    className="h-12 w-12 rounded-full ring-2 ring-cyan-500/30 object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{t.author}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {t.role} • <span className="text-blue-400 font-medium">{t.company}</span>
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </TiltCard>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
