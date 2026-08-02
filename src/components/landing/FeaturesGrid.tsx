"use client";

import React, { useEffect, useRef, useState } from "react";
import { Smartphone, Clock, BarChart3, Users, Shield, Settings } from "lucide-react";

export function FeaturesGrid() {
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

  const features = [
    { icon: Smartphone, title: "No Apps Required", desc: "Customers join via QR code, SMS, or web link. Zero friction." },
    { icon: Clock, title: "Real-time Updates", desc: "Live estimated wait times and automated SMS notifications." },
    { icon: BarChart3, title: "Deep Analytics", desc: "Understand your peak hours and optimize staffing efficiency." },
    { icon: Users, title: "Multi-department", desc: "Route patients or customers across different service lines seamlessly." },
    { icon: Shield, title: "Enterprise Grade", desc: "HIPAA compliant, end-to-end encrypted, and highly available." },
    { icon: Settings, title: "Custom Branding", desc: "Your colors, your logo. White-label the entire patient experience." },
  ];

  return (
    <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feat, i) => (
        <div 
          key={i} 
          className={`premium-glass p-8 rounded-2xl cursor-pointer group transition-all duration-700 transform border border-transparent ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          } hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]`}
          style={{ transitionDelay: isVisible ? `${i * 80}ms` : "0ms" }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 text-blue-500 flex items-center justify-center mb-6 group-hover:from-blue-500 group-hover:to-indigo-500 group-hover:text-white transition-all duration-300">
            <feat.icon className="w-6 h-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{feat.title}</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
        </div>
      ))}
    </div>
  );
}
