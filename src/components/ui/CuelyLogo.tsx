'use client';

import React from 'react';

interface CuelyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export function CuelyLogo({ size = 'md', className = '', showGlow = true }: CuelyLogoProps) {
  const sizeMap = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 bg-white/10 border border-white/20 p-1 select-none backdrop-blur-md overflow-hidden transition-transform duration-200 ${
        sizeMap[size]
      } ${className}`}
      style={{
        boxShadow: showGlow
          ? '0 8px 24px -2px rgba(59, 130, 246, 0.5), 0 0 16px rgba(6, 182, 212, 0.4)'
          : '0 4px 12px rgba(0, 0, 0, 0.2)',
      }}
    >
      <img
        src="/icon.png"
        alt="Cuely Logo"
        className="w-full h-full object-contain rounded-inherit"
      />
    </div>
  );
}
