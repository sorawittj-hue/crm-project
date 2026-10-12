export const springSmooth = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
  mass: 0.8,
};

export const springSnappy = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.6,
};

export const easeStandard = [0.19, 1, 0.22, 1];
export const easeExpOut   = [0.16, 1, 0.3, 1];
export const easeExpIn    = [0.7, 0, 0.84, 0];

export const pageMotion = {
  initial:    { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate:    { opacity: 1, y: 0,  filter: 'blur(0px)' },
  exit:       { opacity: 0, y: -8, filter: 'blur(2px)' },
  transition: { duration: 0.38, ease: easeExpOut },
};

export const reduceMotionProps = {
  initial:    false,
  animate:    undefined,
  exit:       undefined,
  transition: { duration: 0 },
};

export const getPressMotion = (shouldReduceMotion) =>
  shouldReduceMotion
    ? {}
    : {
        whileHover: { y: -2, scale: 1.015 },
        whileTap:   { scale: 0.97 },
        transition: springSnappy,
      };

export const getCardMotion = (shouldReduceMotion) =>
  shouldReduceMotion
    ? { initial: false, animate: undefined, transition: { duration: 0 } }
    : {
        initial:    { opacity: 0, y: 12, scale: 0.97 },
        animate:    { opacity: 1, y: 0,  scale: 1 },
        transition: { ...springSmooth },
      };
