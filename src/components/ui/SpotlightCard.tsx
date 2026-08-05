'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(139, 92, 246, 0.15)',
  borderColor = 'rgba(255, 255, 255, 0.15)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      data-cursor="hover"
      className={`group relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-xl p-6 transition-all duration-300 ${className}`}
      style={{
        boxShadow: isHovered
          ? `0 12px 35px -10px rgba(0,0,0,0.5), 0 0 25px ${spotlightColor}`
          : '0 8px 30px rgba(0,0,0,0.3)',
      }}
    >
      {/* Dynamic Cursor Flashlight Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />

      {/* Subtle border glow spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          border: `1px solid ${borderColor}`,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1), transparent 80%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
