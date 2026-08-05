'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Spring physics for smooth follower motion
  const cursorX = useSpring(0, { stiffness: 400, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 400, damping: 28 });

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check if mouse is hovering an interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive =
          target.closest('a, button, input, select, textarea, [role="button"], [data-cursor="hover"]') !== null;
        setIsHovered(isInteractive);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible]);

  if (reducedMotion || !isVisible) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-difference"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: isHovered ? 48 : 16,
        height: isHovered ? 48 : 16,
        backgroundColor: '#ffffff',
        opacity: isVisible ? 0.9 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 22,
        mass: 0.2,
      }}
    />
  );
}
