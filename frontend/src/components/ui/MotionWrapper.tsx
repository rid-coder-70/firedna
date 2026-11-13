"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

/**
 * Smooth viewport/mount entrance wrapper with reduced-motion friendliness.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.42,
  yOffset = 14,
  className = "",
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

/**
 * Coordinates sequential child reveal animations across responsive grids.
 */
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.07,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.06 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
}

/**
 * Child card wrapper paired with StaggerContainer.
 */
export function StaggerItem({
  children,
  className = "",
  hoverLift = false,
}: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.38, ease: EASE_OUT_EXPO },
        },
      }}
      whileHover={hoverLift ? { y: -3 } : undefined}
      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

