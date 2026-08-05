'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  delay?: number;
  once?: boolean;
}

export function RevealOnScroll({
  children,
  className = '',
  stagger = false,
  delay = 0,
  once = true,
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={stagger ? staggerContainerVariant : fadeUpVariant}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
