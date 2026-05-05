import { motion, useReducedMotion } from 'framer-motion';
import { pageMotion, reduceMotionProps } from '../../lib/motion';

/**
 * Page Transition Wrapper Component
 * Provides consistent entrance animations for all pages
 */
export default function PageTransition({ children }) {
  const shouldReduceMotion = useReducedMotion();
  const motionProps = shouldReduceMotion ? reduceMotionProps : pageMotion;

  return (
    <motion.div
      {...motionProps}
      style={styles.container}
    >
      {children}
    </motion.div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
  },
};

