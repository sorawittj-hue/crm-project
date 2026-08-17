import * as React from "react"
import { cn } from "../../lib/utils"
import { motion, useReducedMotion } from "framer-motion"
import { getPressMotion } from "../../lib/motion"

const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}, ref) => {
  const shouldReduceMotion = useReducedMotion()
  const pressMotion = getPressMotion(shouldReduceMotion)

  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200 ease-out select-none cursor-pointer"

  const variants = {
    default:
      "bg-gradient-to-b from-violet-500 to-violet-700 text-white rounded-xl shadow-[0_4px_14px_rgba(124,58,237,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] hover:from-violet-400 hover:to-violet-600 active:scale-[0.98]",
    primary:
      "bg-gradient-to-b from-violet-500 to-violet-700 text-white rounded-xl shadow-[0_4px_14px_rgba(124,58,237,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] hover:from-violet-400 hover:to-violet-600 active:scale-[0.98]",
    destructive:
      "bg-gradient-to-b from-rose-500 to-rose-700 text-white rounded-xl shadow-[0_4px_14px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(244,63,94,0.45)] hover:from-rose-400 hover:to-rose-600 active:scale-[0.98]",
    outline:
      "border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.98]",
    secondary:
      "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-xl hover:bg-slate-200 dark:hover:bg-white/15 active:scale-[0.98]",
    ghost:
      "text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]",
    link:
      "text-violet-600 dark:text-violet-400 underline-offset-4 hover:underline hover:text-violet-700 dark:hover:text-violet-300 p-0 h-auto font-medium",
    minimal:
      "bg-transparent text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]",
    emerald:
      "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.45)] hover:from-emerald-400 hover:to-emerald-600 active:scale-[0.98]",
    mint:
      "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.45)] hover:from-emerald-400 hover:to-emerald-600 active:scale-[0.98]",
    amber:
      "bg-gradient-to-b from-amber-400 to-amber-600 text-amber-950 rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_20px_rgba(245,158,11,0.45)] hover:from-amber-300 hover:to-amber-500 active:scale-[0.98]",
    glass:
      "bg-white/70 dark:bg-white/10 text-slate-800 dark:text-white border border-white/60 dark:border-white/15 backdrop-blur-xl shadow-xs hover:bg-white/90 dark:hover:bg-white/20 active:scale-[0.98]",
  }

  const sizes = {
    default: "h-10 md:h-11 px-5 py-2 text-sm",
    sm: "h-8 md:h-9 px-3.5 text-xs rounded-xl",
    lg: "h-11 md:h-12 px-7 text-base rounded-2xl",
    icon: "h-10 w-10 rounded-xl p-0",
    xs: "h-7 px-2.5 text-[11px] rounded-lg",
  }

  const buttonVariants = cn(
    baseStyles,
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className
  )

  if (asChild) {
    return (
      <button
        ref={ref}
        className={buttonVariants}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <motion.button
      ref={ref}
      className={buttonVariants}
      whileHover={pressMotion.whileHover}
      whileTap={pressMotion.whileTap}
      transition={pressMotion.transition}
      {...props}
    >
      {children}
    </motion.button>
  )
})
Button.displayName = "Button"

export { Button }
