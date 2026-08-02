"use client";

import React, { useEffect, useRef, useState } from "react";

export function StepsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reduced motion check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const steps = [
    { step: "01", title: "Join", desc: "Customer scans a QR code at your entrance or clicks a link to join the queue virtually." },
    { step: "02", title: "Wait Anywhere", desc: "They track their status live on their phone and receive SMS alerts as their turn approaches." },
    { step: "03", title: "Serve", desc: "Your staff calls the next ticket with one tap. The customer arrives right on time." },
  ];

  return (
    <div id="how-it-works" className="py-24 bg-[var(--stat-strip-bg)] border-y border-[var(--border-color)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[var(--text-primary)]">Three steps to flow.</h2>
        </div>
        
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--bg-card-inner)] via-[var(--bg-card-inner)] to-[var(--bg-card-inner)] -translate-y-1/2 overflow-hidden">
            <div className={`h-full bg-gradient-to-r from-blue-500/20 via-indigo-500/50 to-blue-500/20 w-full transition-transform duration-1000 ease-out origin-left ${isVisible ? "scale-x-100" : "scale-x-0"}`}></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((item, i) => (
              <div 
                key={i} 
                className={`relative z-10 flex flex-col items-center text-center transition-all duration-700 delay-[${i * 200}ms] ${
                  isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
                }`}
                style={{ transitionDelay: isVisible ? `${i * 200}ms` : "0ms" }}
              >
                <div className="w-16 h-16 rounded-full premium-glass bg-[var(--bg-card-inner)] flex items-center justify-center text-2xl font-bold text-[var(--text-primary)] mb-6 shadow-xl shadow-blue-500/10">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
