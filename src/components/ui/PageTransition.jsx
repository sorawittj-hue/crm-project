import { motion } from 'framer-motion';

/**
 * Page Transition Wrapper Component
 * Provides consistent entrance animations for all pages
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
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

export { pageVariants };
