"use client";

import React, { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  value: string;
  label: string;
  delayMs?: number;
  onDone?: () => void;
}

export function StatCounter({ value, label, delayMs = 0, onDone }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  const ref = useRef<HTMLDivElement>(null);
  
  // Parse numeric part and affixes
  const numericMatch = value.match(/[\d.]+/);
  const numericPart = numericMatch ? parseFloat(numericMatch[0]) : 0;
  const isFloat = numericPart % 1 !== 0;
  const decimals = isFloat ? (numericMatch![0].split('.')[1]?.length || 0) : 0;
  
  const prefix = value.substring(0, value.indexOf(numericMatch?.[0] || ''));
  const suffix = value.substring((value.indexOf(numericMatch?.[0] || '') + (numericMatch?.[0].length || 0)));

  useEffect(() => {
    // Reduced motion check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setCount(numericPart);
      setAnimationProgress(1);
      setIsVisible(true);
      setHasAnimated(true);
      setIsDone(true);
      if (onDone) onDone();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
          
          setTimeout(() => {
            let startTimestamp: number | null = null;
            const duration = 2000; // 2 seconds

            const step = (timestamp: number) => {
              if (!startTimestamp) startTimestamp = timestamp;
              const progress = Math.min((timestamp - startTimestamp) / duration, 1);
              
              // easeOutQuart
              const easeOut = 1 - Math.pow(1 - progress, 4);
              
              setCount(numericPart * easeOut);
              setAnimationProgress(easeOut);
              
              if (progress < 1) {
                window.requestAnimationFrame(step);
              } else {
                setCount(numericPart);
                setAnimationProgress(1);
                setIsDone(true);
                if (onDone) onDone();
              }
            };
            
            window.requestAnimationFrame(step);
          }, delayMs);
          
          if (ref.current) {
            observer.unobserve(ref.current);
          }
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
  }, [numericPart, delayMs, hasAnimated, onDone]);

  return (
    <div 
      ref={ref} 
      className={`text-center px-4 transition-all duration-700 transform flex flex-col items-center justify-center ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div 
        className={`text-3xl md:text-4xl font-extrabold mb-2 transition-all duration-500 ${
          isDone ? "drop-shadow-[0_0_12px_rgba(59,130,246,0.3)] scale-105" : "scale-100"
        }`}
        style={{ 
          color: isDone ? "var(--text-primary)" : "var(--text-secondary)",
        }}
      >
        {prefix}{count.toFixed(decimals)}{suffix}
      </div>
      <div className="w-16 h-0.5 bg-blue-500/20 rounded-full mb-3 overflow-hidden">
        <div 
          className="h-full bg-blue-500"
          style={{ width: `${animationProgress * 100}%` }}
        />
      </div>
      <div className="text-sm text-[var(--text-muted)] font-medium">{label}</div>
    </div>
  );
}

export function StatsSection() {
  const [isFullyDone, setIsFullyDone] = useState(false);

  const stats = [
    { label: "Tokens Issued", value: "10M+" },
    { label: "Avg Wait Reduction", value: "45%" },
    { label: "Satisfaction Rate", value: "99.8%" },
    { label: "Uptime", value: "99.99%" },
  ];

  return (
    <div className={`py-12 border-b border-[var(--border-color)] transition-colors duration-1000`}>
      <div 
        className={`max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x transition-colors duration-1000 ${
          isFullyDone ? "divide-[var(--border-color)]" : "divide-transparent"
        }`}
      >
        {stats.map((stat, i) => (
          <StatCounter 
            key={i} 
            label={stat.label} 
            value={stat.value} 
            delayMs={i * 150}
            onDone={i === stats.length - 1 ? () => setTimeout(() => setIsFullyDone(true), 100) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
