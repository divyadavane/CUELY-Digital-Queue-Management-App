'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Activity, BellRing, ShieldCheck, Video, Languages,
  Keyboard, MonitorPlay, CalendarClock, FileText, BarChart3,
  LayoutDashboard, Sparkles, Lock, ClipboardList, CreditCard, Tablet,
  Users, Stethoscope, Building2,
} from 'lucide-react';
import { PERSONA_TABS, PersonaTab, PersonaFeature } from '@/lib/landing-data';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { TiltCard } from '@/components/ui/TiltCard';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { GradientText } from '@/components/ui/GradientText';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

const iconMap: Record<string, React.ElementType> = {
  QrCode, Activity, BellRing, ShieldCheck, Video, Languages,
  Keyboard, MonitorPlay, CalendarClock, FileText, BarChart3,
  LayoutDashboard, Sparkles, Lock, ClipboardList, CreditCard, Tablet,
  Users, Stethoscope, Building2,
};

const tabIconMap: Record<string, React.ElementType> = {
  Users,
  Stethoscope,
  Building2,
};

export function FeatureGridSection() {
  const [activeTab, setActiveTab] = useState(PERSONA_TABS[0].id);
  const activePersona = PERSONA_TABS.find((t) => t.id === activeTab) || PERSONA_TABS[0];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-4 shadow-sm">
            <CuelyLogo size="xs" showGlow />
            <span>Built for Every Role</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Features That <GradientText>Actually Matter</GradientText>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Cuely works differently for patients, doctors, and admins. Explore what each persona gets.
          </p>
        </RevealOnScroll>

        {/* Persona Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-14">
          {PERSONA_TABS.map((tab) => {
            const TabIcon = tabIconMap[tab.iconName] || Users;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer w-full sm:w-auto justify-center
                  ${isActive
                    ? 'text-white bg-white/10 border border-white/20 shadow-lg shadow-blue-500/10'
                    : 'text-white/50 bg-transparent border border-transparent hover:text-white/80 hover:bg-white/5'
                  }
                `}
                data-cursor="hover"
              >
                <TabIcon className="h-4 w-4" />
                <span>{tab.label}</span>
                {/* Active gradient underline */}
                {isActive && (
                  <motion.div
                    layoutId="persona-tab-underline"
                    className="absolute -bottom-[1px] left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Description */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activePersona.id + '-desc'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="text-center text-sm text-white/40 mb-10 max-w-xl mx-auto"
          >
            {activePersona.description}
          </motion.p>
        </AnimatePresence>

        {/* Feature Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {activePersona.features.map((feature: PersonaFeature) => {
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
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
