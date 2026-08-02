"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BackgroundBlobs } from "./BackgroundBlobs";
import { QueueMockup } from "./QueueMockup";

export function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // Use requestAnimationFrame for smoother parallax, but for simple offset, this is okay
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen pt-32 pb-16 px-6 overflow-hidden flex items-center">
      {/* Organic Background Blobs */}
      <div className="hero-seq hero-seq-1 absolute inset-0">
        <BackgroundBlobs />
      </div>
      
      <div 
        className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
      >
        {/* Left Column (55%): Text & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* Headline */}
          <div className="overflow-hidden">
            <h1 className="hero-seq hero-seq-2 text-6xl md:text-7xl font-sans font-bold text-foreground leading-[1.05] tracking-tight mb-2">
              Manage queues<br className="hidden sm:block"/> with an
            </h1>
          </div>
          
          <h1 className="hero-seq-cursive text-7xl md:text-9xl font-accent text-[var(--color-accent-serif)] leading-[1.15] mb-8 origin-left pl-2 md:pl-4" style={{ letterSpacing: 'normal' }}>
            unfair advantage
          </h1>

          {/* Subheadline */}
          <p className="hero-seq hero-seq-3 max-w-md text-lg text-muted-foreground font-sans mb-10 leading-relaxed tracking-normal">
            The premium queue management system that respects your customers' time. No apps to download, no standing in line. Just a seamless, VIP waiting experience.
          </p>

          {/* CTAs */}
          <div className="hero-seq hero-seq-4 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-4">
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold premium-shadow hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center bg-transparent text-foreground border border-border px-8 py-4 rounded-full font-bold hover:bg-black/5 dark:hover:bg-white/5 hover:scale-[1.02] transition-all duration-300"
            >
              How It Works
            </a>
          </div>
          
          <p className="hero-seq hero-seq-5 text-xs text-muted-foreground font-medium tracking-wide">
            Start reclaiming your time &middot; 5-minute setup
          </p>
        </div>

        {/* Right Column (45%): Live Visual Mockup with Parallax */}
        <div 
          className="hero-seq hero-seq-5 lg:col-span-5 relative w-full flex justify-center lg:justify-end mt-12 lg:mt-0"
          style={{ 
            transform: `translateY(${scrollY * 0.08}px)`, // Subtle parallax drifting slower than scroll
            transition: 'transform 0.1s ease-out'
          }}
        >
          <QueueMockup />
        </div>
      </div>
    </section>
  );
}
