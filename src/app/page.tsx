'use client';

import React from 'react';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { LandingNavbar } from '@/components/sections/LandingNavbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { LogoMarqueeSection } from '@/components/sections/LogoMarqueeSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { FeatureGridSection } from '@/components/sections/FeatureGridSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { TelemedicineSection } from '@/components/sections/TelemedicineSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { FinalCtaSection } from '@/components/sections/FinalCtaSection';
import { FooterSection } from '@/components/sections/FooterSection';
import { LandingChatWidget } from '@/components/landing/LandingChatWidget';

export default function FlowlyLandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden font-sans relative selection:bg-blue-500/30 selection:text-blue-200">
      {/* Custom Spring Physics Pointer Follower */}
      <CustomCursor />

      {/* Subtle Aurora Ambient Animated Background */}
      <AnimatedBackground isInterior={false} />

      {/* 1. Nav bar */}
      <LandingNavbar />

      <main>
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Logo Marquee */}
        <LogoMarqueeSection />

        {/* 4. Stats Band (NEW) */}
        <StatsSection />

        {/* 5. Feature Grid (Now Tabbed) */}
        <FeatureGridSection />

        {/* 6. How It Works (Now 4 Steps) */}
        <HowItWorksSection />

        {/* 7. Telemedicine Spotlight (NEW) */}
        <TelemedicineSection />

        {/* 8. Testimonials */}
        <TestimonialsSection />

        {/* 9. FAQ */}
        <FaqSection />

        {/* 10. Final CTA */}
        <FinalCtaSection />
      </main>

      {/* 11. Footer */}
      <FooterSection />

      {/* AI Assistant Floating Widget (Backend Intact) */}
      <LandingChatWidget />
    </div>
  );
}
