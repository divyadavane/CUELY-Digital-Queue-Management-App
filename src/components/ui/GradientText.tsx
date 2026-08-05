'use client';

import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 animate-gradient-shimmer ${className}`}
      style={{
        backgroundSize: '200% 200%',
        animation: 'shimmer 6s linear infinite',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {children}
    </span>
  );
}
