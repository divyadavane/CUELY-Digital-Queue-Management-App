'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, MessageSquare, Sparkles, Monitor, BarChart3, Smartphone } from 'lucide-react';
import { FEATURES_DATA, FeatureItem } from '@/lib/landing-data';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { TiltCard } from '@/components/ui/TiltCard';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { GradientText } from '@/components/ui/GradientText';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

const iconMap: Record<string, React.ElementType> = {
  QrCode,
  MessageSquare,
  Sparkles,
  Monitor,
  BarChart3,
  Smartphone,
};

export function FeatureGridSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-4 shadow-sm">
            <CuelyLogo size="xs" showGlow />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for <GradientText>Zero Wait Times</GradientText>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Everything you need to orchestrate seamless visitor flow, empower staff counters, and eliminate lobby queues.
          </p>
        </RevealOnScroll>

        {/* 3-Column Responsive Grid */}
        <RevealOnScroll stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES_DATA.map((feature: FeatureItem) => {
            const IconComponent = iconMap[feature.iconName] || Sparkles;
            return (
              <TiltCard key={feature.id} maxTilt={8}>
                <SpotlightCard
                  spotlightColor={feature.accentColor ? `${feature.accentColor}25` : 'rgba(59,130,246,0.2)'}
                  borderColor={feature.accentColor ? `${feature.accentColor}60` : 'rgba(255,255,255,0.2)'}
                  className="h-full flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 shadow-lg"
                        style={{
                          background: `radial-gradient(circle at center, ${feature.accentColor || '#3b82f6'}30, rgba(255,255,255,0.05))`,
                        }}
                      >
                        <IconComponent
                          className="h-6 w-6"
                          style={{ color: feature.accentColor || '#60a5fa' }}
                        />
                      </div>
                      {feature.badge && (
                        <span
                          className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase border"
                          style={{
                            backgroundColor: `${feature.accentColor || '#3b82f6'}15`,
                            color: feature.accentColor || '#60a5fa',
                            borderColor: `${feature.accentColor || '#3b82f6'}35`,
                          }}
                        >
                          {feature.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                    <span>Learn more</span>
                    <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </SpotlightCard>
              </TiltCard>
            );
          })}
        </RevealOnScroll>
      </div>
    </section>
  );
}
