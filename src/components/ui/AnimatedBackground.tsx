'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedBackgroundProps {
  isInterior?: boolean;
}

export function AnimatedBackground({ isInterior = false }: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use lower opacity for dashboard/interior pages
  const baseOpacityClass = isInterior ? 'opacity-50' : 'opacity-100';
  const blobOpacityClass = isInterior ? 'opacity-[0.08]' : 'opacity-[0.15]';

  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none overflow-hidden transition-opacity duration-700 ${baseOpacityClass}`}>
      {/* Dark Navy Background Base */}
      <div className="absolute inset-0 bg-[#0F0F23] transition-colors duration-300"></div>

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0F23]/50 to-[#0F0F23]"></div>

      {/* Animated Gradient Blobs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600 blur-[120px] mix-blend-screen animate-blob-drift-1 ${blobOpacityClass}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500 blur-[150px] mix-blend-screen animate-blob-drift-2 ${blobOpacityClass}`}></div>
      <div className={`absolute top-[40%] left-[60%] w-[40vw] h-[40vw] rounded-full bg-indigo-500 blur-[100px] mix-blend-screen animate-blob-drift-3 ${blobOpacityClass}`}></div>

      {/* Ambient Sparkle Particles */}
      {mounted && (
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => {
            const size = Math.random() * 3 + 1;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 10;
            const duration = Math.random() * 10 + 10;

            return (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-particle-float"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  opacity: 0,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
