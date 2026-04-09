import { useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, animate } from 'framer-motion';

/**
 * Animated Counter Component
 * Numbers count up smoothly from 0 to target value
 */
export default function AnimatedCounter({ 
  value = 0, 
  duration = 1.5,
  prefix = '',
  suffix = '',
  formatter = null,
  style = {},
  className = '',
}) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  });
  
  const displayValue = useRef(value);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        displayValue.current = latest;
      },
    });

    return controls.stop;
  }, [value, duration, motionValue]);

  // Format number based on formatter or default
  const formatNumber = (num) => {
    if (formatter) {
      return formatter(num);
    }
    
    // Default formatting
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    
    // Handle decimals
    if (!Number.isInteger(num)) {
      return num.toFixed(2);
    }
    
    return num.toLocaleString();
  };

  return (
    <motion.span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {prefix}{formatNumber(value)}{suffix}
    </motion.span>
  );
}

// Alternative: Currency formatted counter
export function CurrencyCounter({ value = 0, currency = '฿', style = {} }) {
  return (
    <AnimatedCounter 
      value={value} 
      prefix={currency}
      formatter={(num) => num.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      style={style}
    />
  );
}

// Percentage counter
export function PercentCounter({ value = 0, decimals = 1, style = {} }) {
  return (
    <AnimatedCounter 
      value={value} 
      suffix="%"
      formatter={(num) => num.toFixed(decimals)}
      style={style}
    />
  );
}
