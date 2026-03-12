import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

const Sheet = ({ open, onOpenChange, children, title, description }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl h-full border-l border-white/5 bg-card/80 backdrop-blur-3xl shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="min-w-0">
                <h2 className="text-lg font-black uppercase tracking-widest truncate">{title}</h2>
                {description && <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">{description}</p>}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const SheetContent = ({ children, className }) => {
  return (
    <div className={`relative w-full max-w-xl h-full border-l border-white/5 bg-card/80 backdrop-blur-3xl shadow-2xl flex flex-col ${className || ''}`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  )
}

export { Sheet, SheetContent }
