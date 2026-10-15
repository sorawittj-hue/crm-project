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

  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200 ease-out select-none cursor-pointer"

  const variants = {
    default:
      "bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_auto] hover:bg-right text-white rounded-xl shadow-[0_4px_14px_-2px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_-2px_rgba(124,58,237,0.5)] active:scale-[0.98]",
    primary:
      "bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_auto] hover:bg-right text-white rounded-xl shadow-[0_4px_14px_-2px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_-2px_rgba(124,58,237,0.5)] active:scale-[0.98]",
    destructive:
      "bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl shadow-[0_4px_14px_-2px_rgba(244,63,94,0.35)] hover:from-rose-500 hover:to-red-500 active:scale-[0.98]",
    outline:
      "border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md text-slate-700 dark:text-slate-200 rounded-xl hover:bg-violet-50/50 dark:hover:bg-white/[0.08] hover:border-violet-300 dark:hover:border-violet-500/30 hover:text-violet-700 dark:hover:text-white",
    secondary:
      "bg-slate-100/90 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-xl hover:bg-slate-200/80 dark:hover:bg-white/15",
    ghost:
      "text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
    link:
      "text-violet-700 dark:text-violet-300 underline-offset-4 hover:underline hover:text-violet-800 dark:hover:text-violet-200 p-0 h-auto font-medium",
    minimal:
      "bg-transparent text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]",
    emerald:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-[0_4px_14px_-2px_rgba(16,185,129,0.35)] hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]",
    mint:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-[0_4px_14px_-2px_rgba(16,185,129,0.35)] hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]",
    amber:
      "bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 rounded-xl shadow-[0_4px_14px_-2px_rgba(245,158,11,0.35)] hover:from-amber-300 hover:to-orange-300 active:scale-[0.98]",
    glass:
      "bg-white/80 dark:bg-white/10 backdrop-blur-xl text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/15 shadow-sm hover:bg-white dark:hover:bg-white/15 rounded-xl",
  }

  const sizes = {
    default: "h-10 md:h-11 px-5 py-2 text-sm",
    sm: "h-9 md:h-10 px-3.5 text-xs rounded-xl",
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
