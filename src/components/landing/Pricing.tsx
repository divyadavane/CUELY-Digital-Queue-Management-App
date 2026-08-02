"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for single-location shops just getting started.",
    features: [
      "Up to 500 queued customers/mo",
      "Standard QR code poster",
      "Basic analytics",
      "Email support"
    ],
    recommended: false,
    cta: "Start Free Trial"
  },
  {
    name: "Pro",
    price: "$79",
    description: "For busy locations needing advanced features and insights.",
    features: [
      "Unlimited queued customers",
      "Custom branded QR code poster",
      "Smart wait-time estimates",
      "Advanced analytics dashboard",
      "Priority SMS notifications"
    ],
    recommended: true,
    cta: "Start Free Trial"
  }
];

export function Pricing() {
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

    const elements = sectionRef.current?.querySelectorAll(".reveal-fade");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 relative bg-surface overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16 text-center max-w-2xl mx-auto reveal-fade transition-all duration-700 opacity-0 translate-y-4 [&.active]:opacity-100 [&.active]:translate-y-0">
          <h2 className="text-4xl font-sans font-bold text-foreground mb-4 tracking-tight">
            Simple, transparent pricing.
          </h2>
          <p className="text-lg text-muted-foreground font-sans">
            Start for free. Upgrade when you need more power.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              className={`relative rounded-3xl p-8 bg-background border transition-all duration-300 reveal-fade transition-all duration-700 opacity-0 translate-y-4 [&.active]:opacity-100 [&.active]:translate-y-0 ${
                plan.recommended 
                  ? "border-accent premium-shadow scale-100 md:scale-105 z-10" 
                  : "border-border shadow-sm hover:-translate-y-1"
              }`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                  Recommended
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm font-medium">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.recommended ? "text-accent" : "text-muted-foreground"}`} />
                    <span className="text-sm text-foreground font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full py-3 rounded-full font-bold transition-all duration-300 ${
                  plan.recommended 
                    ? "bg-primary text-primary-foreground hover:scale-[1.02] premium-shadow" 
                    : "bg-transparent border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
