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

  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors duration-150 ease-out select-none cursor-pointer"

  const variants = {
    default:
      "bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-700 active:bg-violet-800",
    primary:
      "bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-700 active:bg-violet-800",
    destructive:
      "bg-rose-600 text-white rounded-lg shadow-sm hover:bg-rose-700 active:bg-rose-800",
    outline:
      "border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-slate-400 dark:hover:border-white/20",
    secondary:
      "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-slate-200 dark:hover:bg-white/15",
    ghost:
      "text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
    link:
      "text-violet-700 dark:text-violet-300 underline-offset-4 hover:underline hover:text-violet-800 dark:hover:text-violet-200 p-0 h-auto font-medium",
    minimal:
      "bg-transparent text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]",
    emerald:
      "bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
    mint:
      "bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
    amber:
      "bg-amber-400 text-amber-950 rounded-lg shadow-sm hover:bg-amber-300 active:bg-amber-500",
    glass:
      "bg-white dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 shadow-sm hover:bg-slate-50 dark:hover:bg-white/15",
  }

  const sizes = {
    default: "h-10 md:h-11 px-5 py-2 text-sm",
    sm: "h-9 md:h-10 px-3.5 text-xs rounded-lg",
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
