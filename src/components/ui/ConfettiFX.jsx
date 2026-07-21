import { useMemo } from 'react';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = [
  '#f59e0b', '#10b981', '#7c3aed', '#ec4899', '#06b6d4',
  '#3b82f6', '#f43f5e', '#fbbf24', '#34d399', '#a855f7'
];

const SHAPES = ['square', 'circle', 'rectangle'];

export default function ConfettiFX({ count = 45 }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const shape = SHAPES[i % SHAPES.length];
      const xStart = Math.random() * 100 - 50; // -50 to 50 %
      const xEnd = xStart + (Math.random() * 200 - 100);
      const yEnd = -250 - Math.random() * 300;
      const rotation = Math.random() * 720 - 360;
      const scale = 0.6 + Math.random() * 0.7;
      const delay = Math.random() * 0.2;
      const duration = 1.6 + Math.random() * 0.8;
      const size = 8 + Math.floor(Math.random() * 8);

      return {
        id: i,
        color,
        shape,
        xStart,
        xEnd,
        yEnd,
        rotation,
        scale,
        delay,
        duration,
        size
      };
    });
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden flex items-center justify-center">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 1,
            x: `${p.xStart}vw`,
            y: '20vh',
            rotate: 0,
            scale: p.scale
          }}
          animate={{
            opacity: [1, 1, 0],
            x: `${p.xEnd}vw`,
            y: `${p.yEnd}px`,
            rotate: p.rotation,
            scale: p.scale * 1.2
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 1, 0.5, 1]
          }}
          className="absolute"
          style={{
            width: p.shape === 'rectangle' ? p.size * 1.6 : p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rectangle' ? '2px' : '3px',
            boxShadow: `0 0 10px ${p.color}88`
          }}
        />
      ))}
    </div>
  );
}
