/**
 * animations.js — CRM Premium Motion Library v4.0
 * Framer Motion variants & spring configs for the entire app
 */

// ─── Easing Curves ────────────────────────────────────────────────────────────
export const easeExpOut    = [0.16, 1, 0.3, 1];
export const easeExpIn     = [0.7, 0, 0.84, 0];
export const easeInOut     = [0.45, 0, 0.55, 1];
export const easeStandard  = [0.19, 1, 0.22, 1];

// ─── Spring Presets ───────────────────────────────────────────────────────────
export const springSnappy  = { type: 'spring', stiffness: 500, damping: 35, mass: 0.6 };
export const springSmooth  = { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 };
export const springBouncy  = { type: 'spring', stiffness: 260, damping: 20, mass: 0.9 };
export const springLazy    = { type: 'spring', stiffness: 180, damping: 28, mass: 1.0 };

// ─── Page Transitions ─────────────────────────────────────────────────────────
export const pageVariants = {
  hidden:  { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.4, ease: easeExpOut } },
  exit:    { opacity: 0, y: -8, filter: 'blur(2px)', transition: { duration: 0.2, ease: easeExpIn } },
};

export const pageFade = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: easeExpOut } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

// ─── Container / Stagger Parents ─────────────────────────────────────────────
export const containerVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const containerVariantsFast = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const containerVariantsSlow = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// ─── Card Variants ────────────────────────────────────────────────────────────
export const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { ...springSmooth } },
};

export const cardVariantsFade = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.32, ease: easeExpOut } },
};

export const cardSlideLeft = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0,   transition: { ...springSmooth } },
};

export const cardSlideRight = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0,  transition: { ...springSmooth } },
};

export const cardSlideUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0,  transition: { ...springSmooth } },
};

export const cardPop = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1,    transition: { ...springBouncy } },
};

// ─── List Item Variants ───────────────────────────────────────────────────────
export const listItemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0,   transition: { duration: 0.28, ease: easeExpOut } },
};

export const listItemFade = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.24 } },
};

// ─── Modal / Sheet / Overlay Variants ────────────────────────────────────────
export const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

export const sheetVariantsRight = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0,      opacity: 1, transition: { ...springSnappy } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.22, ease: easeExpIn } },
};

export const sheetVariantsLeft = {
  hidden:  { x: '-100%', opacity: 0 },
  visible: { x: 0,       opacity: 1, transition: { ...springSnappy } },
  exit:    { x: '-100%', opacity: 0, transition: { duration: 0.22, ease: easeExpIn } },
};

export const modalVariants = {
  hidden:  { opacity: 0, scale: 0.92, y: 16 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { ...springSnappy } },
  exit:    { opacity: 0, scale: 0.94, y: 8,  transition: { duration: 0.18, ease: easeExpIn } },
};

// ─── Micro-Interaction Hover Props ───────────────────────────────────────────
export const hoverLift     = { whileHover: { y: -3, scale: 1.015 }, whileTap: { scale: 0.97 }, transition: springSnappy };
export const hoverLiftSoft = { whileHover: { y: -2, scale: 1.01  }, whileTap: { scale: 0.98 }, transition: springSmooth };
export const hoverScale    = { whileHover: { scale: 1.04 },          whileTap: { scale: 0.96 }, transition: springSnappy };
export const hoverGlow     = { whileHover: { scale: 1.02 },          whileTap: { scale: 0.98 }, transition: springSmooth };
export const hoverPulse    = { whileHover: { scale: 1.06 },          whileTap: { scale: 0.94 }, transition: springBouncy };

// ─── Progress Bar Variants ───────────────────────────────────────────────────
export const progressVariants = (targetPct = 0) => ({
  hidden:  { width: '0%'       },
  visible: { width: `${targetPct}%`, transition: { duration: 0.9, ease: easeExpOut, delay: 0.2 } },
});

// ─── Icon / Badge Entrance ────────────────────────────────────────────────────
export const iconPop = {
  hidden:  { opacity: 0, scale: 0, rotate: -15 },
  visible: { opacity: 1, scale: 1, rotate: 0,   transition: { ...springBouncy } },
};

export const badgePop = {
  hidden:  { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1,   transition: { ...springBouncy, delay: 0.15 } },
};

// ─── Notification / Toast Variants ───────────────────────────────────────────
export const toastVariants = {
  hidden:  { opacity: 0, y: 32, scale: 0.88 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { ...springBouncy } },
  exit:    { opacity: 0, y: -8, scale: 0.94, transition: { duration: 0.2 } },
};

// ─── Number Counter Variants ─────────────────────────────────────────────────
export const numberSlideUp = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0, transition: { ...springSnappy } },
};

// ─── Sidebar Nav Variants ─────────────────────────────────────────────────────
export const navItemVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0,   transition: { ...springSmooth } },
};

export const navContainerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

// ─── Tab Indicator Variant ────────────────────────────────────────────────────
export const tabUnderlineVariant = {
  initial:  { opacity: 0, scaleX: 0 },
  animate:  { opacity: 1, scaleX: 1, transition: { ...springSnappy } },
  exit:     { opacity: 0, scaleX: 0, transition: { duration: 0.15 } },
};

// ─── Floating Action Variants ─────────────────────────────────────────────────
export const fabVariants = {
  hidden:  { opacity: 0, scale: 0, rotate: -180 },
  visible: { opacity: 1, scale: 1, rotate: 0,    transition: { ...springBouncy, delay: 0.3 } },
  exit:    { opacity: 0, scale: 0, rotate: 180,  transition: { duration: 0.2 } },
};

// ─── Chart / Data Entrance ────────────────────────────────────────────────────
export const chartReveal = {
  hidden:  { opacity: 0, scaleY: 0.8, originY: 1 },
  visible: { opacity: 1, scaleY: 1,   transition: { duration: 0.6, ease: easeExpOut } },
};

// ─── Section Header Variants ──────────────────────────────────────────────────
export const sectionHeaderVariants = {
  hidden:  { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0,   transition: { duration: 0.35, ease: easeExpOut } },
};

// ─── Skeleton Pulse (for loading states) ─────────────────────────────────────
export const skeletonPulse = {
  animate: { opacity: [0.5, 1, 0.5] },
  transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
};

// ─── Convenience: Reduced-Motion Safe Wrapper ─────────────────────────────────
export const safeMotion = (variants, reduced = false) =>
  reduced ? { initial: false, animate: undefined } : variants;
