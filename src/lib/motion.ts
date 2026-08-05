import { Variants, Transition, TargetAndTransition } from 'framer-motion';

// Spring physics configurations
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 150,
  damping: 20,
};

export const magneticSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
  mass: 0.1,
};

// Centralized Animation Variants
export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const fadeInVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export const scaleUpVariant: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const staggerContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const staggerChildVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const heroBadgeVariant: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const floatAnimation: TargetAndTransition = {
  y: [0, -12, 0],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const glowPulseAnimation: TargetAndTransition = {
  opacity: [0.3, 0.6, 0.3],
  scale: [0.98, 1.05, 0.98],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};
