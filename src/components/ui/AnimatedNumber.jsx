import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * AnimatedNumber component that animates a numeric value from 0 to target value on mount/change.
 */
export function AnimatedNumber({ value, formatter, duration = 0.4, className = '', animate: shouldAnimate = true }) {
  const ref = useRef(null);
  const isReduced = useReducedMotion();

  useEffect(() => {
    if (!shouldAnimate || isReduced) return;
    const numericValue = typeof value === 'number' ? value : parseFloat(value?.toString().replace(/[^0-9.-]+/g, "") || 0);
    if (isNaN(numericValue)) return;
    const controls = animate(0, numericValue, {
      duration,
      ease: [0.19, 1, 0.22, 1],
      onUpdate(val) {
        if (ref.current) {
          ref.current.textContent = formatter ? formatter(val) : Math.round(val).toLocaleString();
        }
      }
    });
    return () => controls.stop();
  }, [value, formatter, duration, shouldAnimate, isReduced]);

  return (
    <span ref={ref} className={cn("font-display", className)}>
      {formatter ? formatter(value) : Math.round(value || 0).toLocaleString()}
    </span>
  );
}
