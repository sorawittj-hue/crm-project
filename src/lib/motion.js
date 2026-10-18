// ─── Spring Configs ───
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

export const springBouncy = {
  type: 'spring',
  stiffness: 400,
  damping: 20,
  mass: 0.7,
};

export const springGentle = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
  mass: 1,
};

// ─── Easing Curves ───
export const easeStandard = [0.19, 1, 0.22, 1];
export const easeExpOut   = [0.16, 1, 0.3, 1];
export const easeExpIn    = [0.7, 0, 0.84, 0];
export const easeBounce   = [0.34, 1.56, 0.64, 1];

// ─── Page Transition ───
export const pageMotion = {
  initial:    { opacity: 0, y: 20, filter: 'blur(6px)', scale: 0.99 },
  animate:    { opacity: 1, y: 0,  filter: 'blur(0px)', scale: 1 },
  exit:       { opacity: 0, y: -12, filter: 'blur(4px)', scale: 0.99 },
  transition: { duration: 0.42, ease: easeExpOut },
};

// ─── Reduced Motion ───
export const reduceMotionProps = {
  initial:    false,
  animate:    undefined,
  exit:       undefined,
  transition: { duration: 0 },
};

// ─── Press / Hover Interactions ───
export const getPressMotion = (shouldReduceMotion) =>
  shouldReduceMotion
    ? {}
    : {
        whileHover: { y: -3, scale: 1.02, transition: springSnappy },
        whileTap:   { scale: 0.96, transition: { ...springSnappy, duration: 0.1 } },
      };

// ─── Card Motion ───
export const getCardMotion = (shouldReduceMotion) =>
  shouldReduceMotion
    ? { initial: false, animate: undefined, transition: { duration: 0 } }
    : {
        initial:    { opacity: 0, y: 16, scale: 0.97 },
        animate:    { opacity: 1, y: 0,  scale: 1 },
        transition: { ...springSmooth },
      };

// ─── Stagger Container ───
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// ─── Stagger Children ───
export const staggerChild = {
  initial:  { opacity: 0, y: 14, scale: 0.97 },
  animate:  { opacity: 1, y: 0,  scale: 1 },
  transition: springSmooth,
};

export const staggerChildFade = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1 },
};

// ─── Slide In Variants ───
export const slideInLeft = {
  initial:    { opacity: 0, x: -20 },
  animate:    { opacity: 1, x: 0 },
  transition: { ...springSmooth },
};

export const slideInRight = {
  initial:    { opacity: 0, x: 20 },
  animate:    { opacity: 1, x: 0 },
  transition: { ...springSmooth },
};

export const slideInUp = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { ...springSmooth },
};

// ─── Scale Variants ───
export const scaleIn = {
  initial:    { opacity: 0, scale: 0.92 },
  animate:    { opacity: 1, scale: 1 },
  transition: { ...springBouncy },
};

export const popIn = {
  initial:    { opacity: 0, scale: 0.8 },
  animate:    { opacity: 1, scale: 1 },
  transition: { ...springBouncy },
};

// ─── Drawer / Sheet ───
export const drawerMotion = {
  initial:    { x: '100%' },
  animate:    { x: 0 },
  exit:       { x: '100%' },
  transition: { ...springSmooth },
};

export const drawerLeftMotion = {
  initial:    { x: '-100%' },
  animate:    { x: 0 },
  exit:       { x: '-100%' },
  transition: { ...springSmooth },
};

// ─── Modal ───
export const modalBackdrop = {
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  exit:       { opacity: 0 },
  transition: { duration: 0.2 },
};

export const modalContent = {
  initial:    { opacity: 0, scale: 0.95, y: 12 },
  animate:    { opacity: 1, scale: 1,    y: 0 },
  exit:       { opacity: 0, scale: 0.97, y: 8 },
  transition: { ...springSmooth },
};

// ─── List Item ───
export const listItemVariants = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: springSmooth },
};

// ─── Number Counter ───
export const counterMotion = {
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  transition: { ...springSmooth, duration: 0.3 },
};

// ─── Hover Glow Card ───
export const glowCardMotion = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.015,
    y: -3,
    transition: springSnappy,
  },
  tap: {
    scale: 0.985,
    transition: { ...springSnappy, duration: 0.08 },
  },
};
