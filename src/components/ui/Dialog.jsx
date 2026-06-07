
import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Dialog — fully-animated modal with:
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange?.(false)}
          />
          {/* Panel */}
          <motion.div
            key="dialog-panel"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
            className={cn("relative z-[101] w-full max-w-lg max-h-[90vh] overflow-y-auto", className)}
          >
            {children}
            <button
              onClick={() => onOpenChange?.(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
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
  <div className={cn("flex flex-col space-y-2 mb-5", className)} {...props} />
)

const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn("text-xl font-bold tracking-tight text-slate-900", className)} {...props} />
)

const DialogDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-slate-500", className)} {...props} />
)

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6", className)} {...props} />
)

const DialogContent = ({ className, children, ...props }) => (
  <div
    className={cn(
      "relative w-full bg-white rounded-2xl border border-slate-100 shadow-2xl p-6",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogContent }
