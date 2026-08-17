import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const badgeVariants = {
  default:      "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_2px_8px_rgba(124,58,237,0.3)]",
  secondary:    "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10",
  destructive:  "bg-gradient-to-r from-rose-500 to-red-600 text-white border-transparent shadow-[0_2px_8px_rgba(244,63,94,0.3)]",
  outline:      "border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 bg-transparent",
  success:      "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-[0_2px_8px_rgba(16,185,129,0.3)]",
  warning:      "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent shadow-[0_2px_8px_rgba(245,158,11,0.3)]",
  info:         "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-[0_2px_8px_rgba(59,130,246,0.3)]",
  
  // Soft tinted variants (Light + Dark compatible)
  violet:       "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30",
  emerald:      "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
  amber:        "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  rose:         "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
  blue:         "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
  sky:          "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  pink:         "bg-pink-50 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30",
  mint:         "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
  lavender:     "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30",
  peach:        "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
}

function Badge({ className, variant = "default", ...props }) {
  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide transition-all duration-200 cursor-default select-none",
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    />
  )
}

export { Badge }
