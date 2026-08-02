"use client";

import React, { useEffect, useRef, useState } from "react";

export function TestimonialsSection() {
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
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const testimonials = [
    { text: "Cuely completely transformed our clinic's waiting room. Patients love the freedom, and our staff is much less stressed.", name: "Dr. Sarah Jenkins", role: "Chief Medical Officer" },
    { text: "The onboarding was instant. We literally signed up, printed the QR code, and were managing queues 5 minutes later.", name: "Michael Chen", role: "Retail Store Manager" },
    { text: "Real-time analytics showed us exactly when we need more staff on the floor. It paid for itself in a week.", name: "Elena Rodriguez", role: "Operations Director" }
  ];

  return (
    <div id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-violet-500/5 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-[var(--text-primary)]">Don't just take our word for it.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((quote, i) => (
            <div 
              key={i} 
              className={`premium-glass p-8 rounded-2xl relative transition-all duration-700 hover:scale-[1.02] hover:-rotate-1 group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: isVisible ? `${i * 150}ms` : "0ms" }}
            >
              <div className="absolute -top-4 -left-2 text-6xl text-blue-500/20 font-serif group-hover:text-blue-500/40 transition-colors">"</div>
              <p className="text-[var(--text-secondary)] text-lg mb-8 relative z-10">{quote.text}</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">{quote.name.charAt(0)}</div>
                <div>
                  <h4 className="font-bold text-[var(--text-primary)]">{quote.name}</h4>
                  <p className="text-sm text-[var(--text-muted)]">{quote.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
