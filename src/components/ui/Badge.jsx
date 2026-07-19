import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const badgeVariants = {
  default:      "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_2px_8px_rgba(124,58,237,0.35)]",
  secondary:    "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
  destructive:  "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-[0_2px_8px_rgba(244,63,94,0.3)]",
  outline:      "border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100",
  success:      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-[0_2px_8px_rgba(16,185,129,0.3)]",
  warning:      "bg-gradient-to-r from-amber-400 to-orange-400 text-white border-transparent shadow-[0_2px_8px_rgba(245,158,11,0.3)]",
  info:         "bg-gradient-to-r from-blue-500 to-sky-500 text-white border-transparent shadow-[0_2px_8px_rgba(59,130,246,0.3)]",
  // Soft tinted variants
  violet:       "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  pink:         "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
  emerald:      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  amber:        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  rose:         "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  blue:         "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  sky:          "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
  // Legacy compat
  mint:         "bg-emerald-50 text-emerald-700 border-emerald-200",
  lavender:     "bg-violet-50 text-violet-700 border-violet-200",
  peach:        "bg-amber-50 text-amber-700 border-amber-200",
}

function Badge({ className, variant = "default", ...props }) {
  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide transition-all duration-200 cursor-default select-none",
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      {...props}
    />
  )
}

export { Badge }
