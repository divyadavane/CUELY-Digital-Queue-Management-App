'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass';
  className?: string;
  magneticRadius?: number;
  magneticStrength?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function MagneticButton({
  children,
  variant = 'primary',
  className = '',
  magneticRadius = 120,
  magneticStrength = 0.35,
  onClick,
  disabled,
  type = 'button',
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.hypot(distanceX, distanceY);

    if (distance < magneticRadius) {
      setPosition({
        x: distanceX * magneticStrength,
        y: distanceY * magneticStrength,
      });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border border-white/20';
      case 'secondary':
        return 'bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md shadow-md';
      case 'glass':
        return 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 backdrop-blur-sm';
      default:
        return '';
    }
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 18, mass: 0.1 }}
      whileTap={{ scale: 0.95 }}
      data-cursor="hover"
      className={`group relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${getVariantStyles()} ${className}`}
    >
      {children}
    </motion.button>
  );
}
