"use client";

import { useEffect, useRef } from "react";
import { BackgroundBlobs } from "./BackgroundBlobs";

const reviews = [
  {
    quote: "Cuely transformed our weekends. We used to have people crowding the entrance; now they grab a coffee next door and come back exactly when we call them.",
    author: "Sarah J.",
    role: "Café Owner",
    offset: "0px"
  },
  {
    quote: "The privacy aspect is huge. Our patients love that they don't have to give us their phone number just to hold a spot in the walk-in clinic.",
    author: "Dr. Chen",
    role: "Urgent Care Director",
    offset: "40px"
  },
  {
    quote: "Setup took literally 10 minutes. Printed the QR code, put it on the counter, and it just worked. Best SaaS investment we've made this year.",
    author: "Marcus T.",
    role: "Barbershop Manager",
    offset: "20px"
  }
];

export function Testimonials() {
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

    const elements = sectionRef.current?.querySelectorAll(".reveal-slide-up");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 relative overflow-hidden flex items-center justify-center min-h-[60vh]">
      <BackgroundBlobs />
      
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="mb-16 text-center max-w-2xl mx-auto reveal-slide-up transition-all duration-700 opacity-0 translate-y-8 [&.active]:opacity-100 [&.active]:translate-y-0">
          <h2 className="text-4xl font-sans font-bold text-foreground mb-4 tracking-tight">
            Loved by businesses.<br/>
            <span className="font-accent italic text-[var(--color-accent-serif)] font-medium">Adored by customers.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <div 
              key={idx}
              className="bg-surface border border-border p-8 rounded-3xl premium-shadow reveal-slide-up transition-all duration-700 opacity-0 translate-y-8 [&.active]:opacity-100 [&.active]:translate-y-0 flex flex-col justify-between"
              style={{ 
                marginTop: review.offset, 
                transitionDelay: `${idx * 150}ms` 
              }}
            >
              <div className="mb-8">
                {/* Custom Quote Icon */}
                <div className="text-[var(--color-terracotta)] opacity-40 mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-lg text-foreground font-medium leading-relaxed font-sans">"{review.quote}"</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                  {review.author[0]}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{review.author}</p>
                  <p className="text-muted-foreground text-xs">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
