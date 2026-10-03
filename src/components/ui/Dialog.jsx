import { createContext, useContext, useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const DialogContext = createContext({ open: false, className: '', placement: 'center' });
const EXIT_DURATION_MS = 220;

function Dialog({ open = false, onOpenChange, children, className = '', placement = 'center' }) {
  return (
    <DialogContext.Provider value={{ open, className, placement }}>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        {children}
      </DialogPrimitive.Root>
    </DialogContext.Provider>
  );
}

function DialogContent({ className = '', children, showCloseButton = true, ...props }) {
  const { open, className: dialogClassName, placement } = useContext(DialogContext);
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      return undefined;
    }

    if (!isMounted) return undefined;

    const timeoutId = window.setTimeout(() => setIsMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isMounted, open]);

  if (!isMounted) return null;

  const overlayMotion = shouldReduceMotion
    ? { initial: false, animate: { opacity: open ? 1 : 0 }, transition: { duration: 0.12 } }
    : { initial: { opacity: 0 }, animate: { opacity: open ? 1 : 0 }, transition: { duration: open ? 0.22 : 0.18 } };
  const panelMotion = placement === 'right'
    ? shouldReduceMotion
      ? { initial: false, animate: { x: open ? 0 : '100%' }, transition: { duration: 0.12 } }
      : {
          initial: { x: '100%' },
          animate: { x: open ? 0 : '100%' },
          transition: open
            ? { type: 'spring', damping: 30, stiffness: 260, mass: 0.9 }
            : { duration: 0.18, ease: 'easeIn' },
        }
    : shouldReduceMotion
      ? { initial: false, animate: { opacity: open ? 1 : 0 }, transition: { duration: 0.12 } }
      : {
        initial: { opacity: 0, scale: 0.96, y: 18 },
        animate: { opacity: open ? 1 : 0, scale: open ? 1 : 0.98, y: open ? 0 : 10 },
        transition: open
          ? { type: 'spring', damping: 27, stiffness: 330, mass: 0.8 }
          : { duration: 0.16, ease: 'easeOut' },
      };

  return (
    <DialogPrimitive.Portal forceMount>
      <DialogPrimitive.Overlay forceMount asChild>
        <motion.div
          {...overlayMotion}
          aria-hidden="true"
          className="fixed inset-0 z-[100] overflow-hidden bg-slate-950/65 backdrop-blur-[7px]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgba(139,92,246,0.20),transparent_48%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_90%,rgba(56,189,248,0.08),transparent_38%)]" />
        </motion.div>
      </DialogPrimitive.Overlay>

      <DialogPrimitive.Content
        forceMount
        asChild
        aria-modal="true"
        aria-label="หน้าต่างโต้ตอบ"
        {...props}
      >
        <motion.div
          {...panelMotion}
          style={{ pointerEvents: open ? 'auto' : 'none' }}
          className={cn(
            'fixed inset-0 z-[101] flex overflow-y-auto overscroll-contain outline-none',
            placement === 'right' ? 'justify-end p-0' : 'items-center justify-center p-3 sm:p-6'
          )}
        >
          <div
            className={cn(
              'relative isolate w-full overflow-hidden border border-white/70 bg-white/95 text-slate-900 shadow-[0_32px_100px_rgba(2,6,23,0.38),0_8px_30px_rgba(109,40,217,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0f111a]/95 dark:text-white dark:shadow-[0_32px_100px_rgba(0,0,0,0.62)]',
              placement === 'right' ? 'h-dvh max-h-none max-w-xl rounded-l-[28px] rounded-r-none' : 'max-h-[90dvh] max-w-lg rounded-[28px]',
              dialogClassName,
              className
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-violet-400/80 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 z-0 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-400/15"
            />
            <div className="relative z-[1]">{children}</div>
            {showCloseButton && (
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-500 shadow-sm backdrop-blur-md transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogPrimitive.Close>
            )}
          </div>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('mb-5 flex flex-col space-y-1.5', className)} {...props} />
);

const DialogTitle = ({ className, ...props }) => (
  <DialogPrimitive.Title
    className={cn('text-xl font-bold tracking-tight text-slate-900 dark:text-white', className)}
    {...props}
  />
);

const DialogDescription = ({ className, ...props }) => (
  <DialogPrimitive.Description
    className={cn('text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
);

const DialogFooter = ({ className, ...props }) => (
  <div className={cn('mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end', className)} {...props} />
);

export { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogContent };
