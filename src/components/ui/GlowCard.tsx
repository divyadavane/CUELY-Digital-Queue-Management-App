'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.25)',
}: GlowCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      data-cursor="hover"
      className={`group relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 backdrop-blur-md transition-all duration-300 ${className}`}
      style={{
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
      }}
    >
      {/* Outer ambient glow on hover */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: glowColor }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
