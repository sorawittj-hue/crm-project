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

  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200 ease-out select-none"

  const variants = {
    default:
      "bg-gradient-to-b from-violet-500 to-violet-700 text-white rounded-xl shadow-[0_4px_14px_rgba(124,58,237,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(124,58,237,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-px",
    destructive:
      "bg-gradient-to-b from-rose-500 to-rose-700 text-white rounded-xl shadow-[0_4px_14px_rgba(225,29,72,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_20px_rgba(225,29,72,0.45)] hover:-translate-y-px",
    outline:
      "border border-violet-100 bg-white text-slate-700 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,1)_inset] hover:bg-violet-50/60 hover:border-violet-200 hover:text-violet-700 hover:shadow-[0_4px_12px_rgba(100,80,200,0.08)]",
    secondary:
      "bg-slate-100 text-slate-700 rounded-xl hover:bg-violet-50 hover:text-violet-700 hover:shadow-sm",
    ghost:
      "text-slate-600 rounded-xl hover:bg-violet-50/80 hover:text-violet-700",
    link:
      "text-violet-600 underline-offset-4 hover:underline hover:text-violet-700",
    minimal:
      "bg-transparent text-slate-600 rounded-xl hover:bg-violet-50 hover:text-violet-700",
    pink:
      "bg-gradient-to-b from-fuchsia-500 to-pink-600 text-white rounded-xl shadow-[0_4px_14px_rgba(236,72,153,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(236,72,153,0.45)] hover:-translate-y-px",
    mint:
      "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white rounded-xl shadow-[0_4px_14px_rgba(52,211,153,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(52,211,153,0.45)] hover:-translate-y-px",
    lavender:
      "bg-gradient-to-b from-violet-400 to-violet-600 text-white rounded-xl shadow-[0_4px_14px_rgba(124,58,237,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(124,58,237,0.45)] hover:-translate-y-px",
    peach:
      "bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-xl shadow-[0_4px_14px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(249,115,22,0.45)] hover:-translate-y-px",
    amber:
      "bg-gradient-to-b from-amber-400 to-amber-600 text-white rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(245,158,11,0.5)] hover:-translate-y-px",
  }

  const sizes = {
    default: "h-11 px-5 py-2 text-sm",
    sm: "h-9 px-4 text-xs rounded-xl",
    lg: "h-12 px-8 text-base rounded-2xl",
    icon: "h-10 w-10 rounded-xl",
    xs: "h-8 px-3 text-xs rounded-lg",
  }

  const buttonVariants = cn(
    baseStyles,
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className
  )

  // asChild: render as plain button with class merge (no motion)
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
