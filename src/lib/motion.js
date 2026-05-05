export const springSmooth = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.75,
};

export const easeStandard = [0.19, 1, 0.22, 1];

export const pageMotion = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, filter: 'blur(3px)' },
  transition: { duration: 0.22, ease: easeStandard },
};

export const reduceMotionProps = {
  initial: false,
  animate: undefined,
  exit: undefined,
  transition: { duration: 0 },
};

export const getPressMotion = (shouldReduceMotion) =>
  shouldReduceMotion
    ? {}
    : {
        whileHover: { y: -1 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16, ease: easeStandard },
      };

export const getCardMotion = (shouldReduceMotion) =>
  shouldReduceMotion
    ? { initial: false, animate: undefined, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: easeStandard },
      };
