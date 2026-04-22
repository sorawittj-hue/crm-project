import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

const Sheet = ({ open, onOpenChange, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-md"
          />

          {/* Sidebar */}
          {children}
          
          {/* Close trigger button (universal) */}
          <div className="absolute top-6 right-[calc(100%-2rem+24px)] md:right-auto md:left-auto md:fixed md:top-8 md:right-[580px] z-[110]">
             <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onOpenChange(false)}
                className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-110 active:scale-95 transition-all shadow-2xl"
             >
                <X size={20} />
             </motion.button>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

const SheetContent = ({ children, className }) => {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      className={cn(
        "relative w-full max-w-xl h-full border-l border-white/5 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-l-[3rem] flex flex-col overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

const SheetHeader = ({ children, className }) => (
  <div className={cn("p-8 pb-0 space-y-2", className)}>
    {children}
  </div>
)

const SheetTitle = ({ children, className }) => (
  <h2 className={cn("text-2xl font-black tracking-tight", className)}>
    {children}
  </h2>
)

const SheetDescription = ({ children, className }) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
)

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription }
