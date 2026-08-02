"use client";

import { useEffect, useRef } from "react";

export function ProblemSection() {
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

    const elements = sectionRef.current?.querySelectorAll(".reveal-slide-right, .reveal-slide-left");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 relative bg-background overflow-hidden border-t border-border/50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Text & Pain Points */}
        <div className="reveal-slide-right transition-all duration-1000 opacity-0 translate-x-[-40px] [&.active]:opacity-100 [&.active]:translate-x-0">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-foreground mb-6 tracking-tight">
            The old way of waiting <br/>
            <span className="font-accent italic text-[var(--color-accent-serif)] font-medium">is broken.</span>
          </h2>
          <p className="text-lg text-muted-foreground font-sans mb-10 leading-relaxed max-w-md">
            Physical queues cause crowding, frustrate customers, and limit your throughput. Buzzers get stolen. Sign-up apps never get downloaded.
          </p>

          <div className="space-y-6">
            {[
              { title: "Lost Revenue", desc: "Customers walk away when they see a crowd at the door." },
              { title: "Staff Burnout", desc: "Your team spends time managing the crowd instead of serving them." },
              { title: "Poor Experience", desc: "No one likes standing in line not knowing how long it will take." }
            ].map((point, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-foreground font-sans mb-1">{point.title}</h4>
                  <p className="text-sm text-muted-foreground">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Duotone Illustration */}
        <div className="reveal-slide-left transition-all duration-1000 opacity-0 translate-x-[40px] [&.active]:opacity-100 [&.active]:translate-x-0 relative">
          <div className="absolute inset-0 bg-accent/5 rounded-3xl blur-2xl transform rotate-3" />
          
          <div className="relative bg-surface border border-border p-8 rounded-3xl premium-shadow h-[400px] flex items-center justify-center overflow-hidden group">
            {/* SVG Duotone Illustration (Navy/Ink + Terracotta) */}
            <svg viewBox="0 0 400 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              
              {/* Abstract crowded dots turning into an organized line */}
              <g className="transition-transform duration-700 group-hover:-translate-x-4">
                {/* Chaotic Crowd (Left) */}
                <circle cx="80" cy="120" r="12" fill="var(--color-foreground)" opacity="0.3" />
                <circle cx="110" cy="150" r="16" fill="var(--color-foreground)" opacity="0.5" />
                <circle cx="70" cy="170" r="10" fill="var(--color-foreground)" opacity="0.2" />
                <circle cx="130" cy="110" r="14" fill="var(--color-foreground)" opacity="0.4" />
                <circle cx="90" cy="200" r="18" fill="var(--color-foreground)" opacity="0.6" />
                <circle cx="140" cy="180" r="12" fill="var(--color-terracotta)" opacity="0.8" />
                
                {/* Connecting Path */}
                <path d="M 150 150 C 200 150, 220 150, 260 150" fill="none" stroke="var(--color-terracotta)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                
                {/* Organized Line (Right) */}
                <rect x="280" y="100" width="80" height="24" rx="12" fill="var(--color-foreground)" opacity="0.1" />
                <rect x="280" y="135" width="80" height="24" rx="12" fill="var(--color-foreground)" opacity="0.2" />
                <rect x="280" y="170" width="80" height="24" rx="12" fill="var(--color-terracotta)" opacity="0.8" />
                <rect x="280" y="205" width="80" height="24" rx="12" fill="var(--color-foreground)" opacity="0.4" />
                
                <text x="320" y="186" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">Served</text>
              </g>
            </svg>
          </div>
        </div>

      </div>
    </section>
  );
}
