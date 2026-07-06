'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate, motion } from 'framer-motion';

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 0.8,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => Math.round(latest).toLocaleString('en-GB'));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value]);

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = prefix + v + suffix;
    });
  }, [rounded, prefix, suffix]);

  return <motion.span ref={ref}>{prefix}0{suffix}</motion.span>;
}
