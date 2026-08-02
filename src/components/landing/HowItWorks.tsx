"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    title: "Scan & Join",
    description: "Customers scan a QR code at your location or click a link on your site to join the virtual queue.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <path d="M14 14h2M18 14h2M14 18h6M18 20v-6" />
      </svg>
    ),
    offset: "up"
  },
  {
    title: "Wait Anywhere",
    description: "They see their real-time position and live wait estimate on their phone, completely app-free.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="12" height="18" rx="3" />
        <path d="M12 18h.01" />
        <path d="M9 3v2h6V3" />
      </svg>
    ),
    offset: "down"
  },
  {
    title: "Get Served",
    description: "When it's their turn, they are notified instantly and step up to the desk. No lingering.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
    offset: "up"
  }
];

export function HowItWorks() {
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
      { threshold: 0.2 }
    );

    const elements = sectionRef.current?.querySelectorAll(".reveal-slide-right");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="process" ref={sectionRef} className="py-24 px-6 relative bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="mb-16 md:mb-24 text-left max-w-2xl reveal-slide-right transition-all duration-700 opacity-0 translate-x-[-20px] [&.active]:opacity-100 [&.active]:translate-x-0">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-foreground mb-4 tracking-tight">
            A frictionless process for everyone.
          </h2>
          <p className="text-lg text-muted-foreground font-sans">
            It takes exactly 5 seconds for a customer to join the line. No downloads, no sign-ups, no frustration.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden md:block relative w-full mt-12 mb-12">
          {/* The connecting line */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border -translate-y-1/2 rounded-full" />
          
          <div className="grid grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col items-center text-center reveal-slide-right transition-all duration-700 opacity-0 translate-x-[-20px] [&.active]:opacity-100 [&.active]:translate-x-0 ${
                  step.offset === 'up' ? '-mt-16' : 'mt-16'
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                {/* Node */}
                <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center premium-shadow z-10 mb-6 group hover:scale-110 hover:border-accent transition-all duration-300">
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold font-sans text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Vertical Timeline */}
        <div className="md:hidden relative space-y-12">
          <div className="absolute top-0 left-8 w-[2px] h-full bg-border rounded-full" />
          
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="relative flex gap-6 items-start reveal-slide-right transition-all duration-700 opacity-0 translate-x-[-20px] [&.active]:opacity-100 [&.active]:translate-x-0"
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center premium-shadow z-10 flex-shrink-0 group hover:scale-110 hover:border-accent transition-all duration-300">
                {step.icon}
              </div>
              <div className="pt-3">
                <h3 className="text-xl font-bold font-sans text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
