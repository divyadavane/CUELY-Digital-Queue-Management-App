"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="py-24 px-6 relative bg-navy-900 overflow-hidden reveal-fade transition-all duration-1000 opacity-0 translate-y-8 [&.active]:opacity-100 [&.active]:translate-y-0"
    >
      {/* Decorative Miniature Mockup (Background) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl opacity-10 pointer-events-none flex justify-between px-12 blur-[2px]">
        {/* Left floating card */}
        <div className="w-48 h-64 bg-white/20 rounded-2xl border border-white/30 transform -rotate-12 translate-y-12 animate-float" />
        {/* Right floating phone shape */}
        <div className="w-56 h-96 bg-white/10 rounded-[2rem] border-4 border-white/20 transform rotate-12 -translate-y-8 animate-float-delayed" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-sans font-bold text-white mb-6 tracking-tight leading-tight">
          Ready to eliminate the wait?
        </h2>
        <p className="text-lg text-white/70 font-sans mb-10 max-w-lg leading-relaxed">
          Join 120+ forward-thinking businesses providing a VIP wait experience for their customers.
        </p>
        
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 bg-white text-navy-900 px-8 py-4 rounded-full font-bold premium-shadow hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
        >
          Start Your Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
