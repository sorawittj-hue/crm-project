
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-background/60 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-[100] w-full max-w-lg border border-border bg-background p-6 shadow-2xl rounded-3xl"
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-2 opacity-60 ring-offset-background transition-all duration-200 hover:opacity-100 hover:bg-pink-50 hover:text-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </motion.div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-3 text-center sm:text-left mb-4", className)} {...props} />
)

const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn("text-xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent", className)} {...props} />
)

const DialogDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)} {...props} />
)

const DialogContent = ({ className, children, ...props }) => (
  <div className={cn("relative w-full max-w-lg", className)} {...props}>
    {children}
  </div>
)

export { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogContent }
