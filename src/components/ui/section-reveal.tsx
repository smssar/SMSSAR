"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
};

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const MotionSection = motion.section;

export function SectionReveal({
  children,
  className,
  delay = 0,
  threshold = 0.2,
}: SectionRevealProps) {
  return (
    <MotionSection
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay }}
      variants={sectionVariants}
    >
      {children}
    </MotionSection>
  );
}
