'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingDown, Smartphone, MapPin, Zap } from 'lucide-react';
import { STATS_DATA } from '@/lib/landing-data';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

const iconMap: Record<string, React.ElementType> = {
  TrendingDown,
  Smartphone,
  MapPin,
  Zap,
};

function AnimatedCounter({ value, suffix }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    // Handle non-numeric values like "<500"
    if (value.startsWith('<')) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            setDisplay(value);
          }
        },
        { threshold: 0.3 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }

    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1800;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * numericValue);
            setDisplay(current.toLocaleString());
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      hasAnimated.current = true;
      setDisplay(value.startsWith('<') ? value : parseInt(value, 10).toLocaleString());
    }
  }, [value]);

  return (
    <span ref={ref} className="font-mono font-black text-3xl sm:text-4xl tracking-tight text-white">
      {display}
      {suffix && <span className="text-2xl sm:text-3xl">{suffix}</span>}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background subtle glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] rounded-full bg-blue-600/5 blur-[120px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll stagger>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATS_DATA.map((stat) => {
              const IconComponent = iconMap[stat.iconName] || Zap;
              return (
                <div
                  key={stat.id}
                  className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8 text-center hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
                >
                  {/* Accent glow line at top */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-16 rounded-full opacity-60 group-hover:w-24 group-hover:opacity-100 transition-all duration-500"
                    style={{ backgroundColor: stat.accentColor }}
                  />

                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 mb-4"
                    style={{ background: `radial-gradient(circle, ${stat.accentColor}25, transparent)` }}
                  >
                    <IconComponent className="h-5 w-5" style={{ color: stat.accentColor }} />
                  </div>

                  <div className="mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
