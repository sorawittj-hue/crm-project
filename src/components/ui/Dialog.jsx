import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Dialog — fully-animated premium modal with:
 * - AnimatePresence for smooth open/close transitions
 * - Scroll lock on body when open
 * - Escape key to close
 * - Portal rendered to document.body
 */
const Dialog = ({ open, onOpenChange, children, className }) => {
  // Scroll lock
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined
    const { body, documentElement } = document
    const prev = body.style.overflow
    const prevPad = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth
    body.style.overflow = "hidden"
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      body.style.overflow = prev
      body.style.paddingRight = prevPad
    }
  }, [open])

  // Escape key
  const handleKeyDown = useCallback(
    (e) => { if (e.key === "Escape") onOpenChange?.(false) },
    [onOpenChange]
  )
  useEffect(() => {
    if (!open) return undefined
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, handleKeyDown])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="dialog-wrapper"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            key="dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={() => onOpenChange?.(false)}
          />
          {/* Panel */}
          <motion.div
            key="dialog-panel"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className={cn(
              "relative z-[101] w-full max-w-lg max-h-[90vh] overflow-y-auto",
              className
            )}
          >
            {children}
            <button
              onClick={() => onOpenChange?.(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-300 z-10"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 mb-5", className)} {...props} />
)

const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn("text-xl font-black tracking-tight text-slate-900", className)} {...props} />
)

const DialogDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-slate-500 font-medium leading-relaxed", className)} {...props} />
)

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-6", className)} {...props} />
)

const DialogContent = ({ className, children, ...props }) => (
  <div
    className={cn(
      "relative w-full bg-white/95 backdrop-blur-xl rounded-3xl border border-violet-100/50",
      "shadow-[0_24px_64px_rgba(0,0,0,0.12),0_8px_24px_rgba(139,92,246,0.08)]",
      "p-6",
      className
    )}
    {...props}
  >
    {/* Top shimmer */}
    <div className="absolute top-0 left-8 right-8 h-px rounded-full bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />
    {children}
  </div>
)

export { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogContent }
