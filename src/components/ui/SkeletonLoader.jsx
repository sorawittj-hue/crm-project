import { motion } from 'framer-motion';

/**
 * Skeleton Loader Component
 * Provides pulsating skeleton shapes for loading states
 */
const shimmerVariants = {
  animate: {
    backgroundPosition: ['-200% 0', '200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export function SkeletonLine({ width = '100%', height = '16px', style = {} }) {
  return (
    <motion.div
      variants={shimmerVariants}
      animate="animate"
      style={{
        width,
        height,
        borderRadius: '6px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ style = {} }) {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', ...style }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <SkeletonLine width="40px" height="40px" style={{ borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="60%" height="14px" style={{ marginBottom: '8px' }} />
          <SkeletonLine width="40%" height="10px" />
        </div>
      </div>
      <SkeletonLine width="100%" height="12px" style={{ marginBottom: '8px' }} />
      <SkeletonLine width="80%" height="12px" />
    </div>
  );
}

export function SkeletonChart({ height = '300px', style = {} }) {
  return (
    <div 
      style={{ 
        height, 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '12px',
        ...style 
      }}
    >
      <SkeletonLine width="40%" height="20px" style={{ marginBottom: '20px' }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
        {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
          <SkeletonLine 
            key={i} 
            width="30px" 
            height={`${h}%`} 
            style={{ borderRadius: '4px 4px 0 0' }} 
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonMetricCard({ style = {} }) {
  return (
    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', ...style }}>
      <SkeletonLine width="50%" height="12px" style={{ marginBottom: '12px' }} />
      <SkeletonLine width="80%" height="32px" style={{ marginBottom: '8px' }} />
      <SkeletonLine width="40%" height="10px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, style = {} }) {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', ...style }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width="25%" height="14px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLine key={colIndex} width="25%" height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonLine;
