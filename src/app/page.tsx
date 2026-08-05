'use client';

import React from 'react';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { LandingNavbar } from '@/components/sections/LandingNavbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { LogoMarqueeSection } from '@/components/sections/LogoMarqueeSection';
import { FeatureGridSection } from '@/components/sections/FeatureGridSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { FinalCtaSection } from '@/components/sections/FinalCtaSection';
import { FooterSection } from '@/components/sections/FooterSection';
import { LandingChatWidget } from '@/components/landing/LandingChatWidget';

export default function FlowlyLandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden font-sans relative selection:bg-purple-500/30 selection:text-purple-200">
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

        {/* 4. Feature Grid */}
        <FeatureGridSection />

        {/* 5. How It Works */}
        <HowItWorksSection />

        {/* 6. Testimonials */}
        <TestimonialsSection />

        {/* 7. FAQ */}
        <FaqSection />

        {/* 8. Final CTA */}
        <FinalCtaSection />
      </main>

      {/* 9. Footer */}
      <FooterSection />

      {/* AI Assistant Floating Widget (Backend Intact) */}
      <LandingChatWidget />
    </div>
  );
}
