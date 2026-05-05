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
  const Comp = asChild ? React.Fragment : motion.button

  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variants = {
    default: "bg-violet-600 text-white shadow-sm shadow-violet-500/15 hover:bg-violet-700 hover:shadow-md hover:shadow-violet-500/20",
    destructive: "bg-rose-600 text-white shadow-sm shadow-rose-500/15 hover:bg-rose-700 hover:shadow-md hover:shadow-rose-500/20",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-violet-200 hover:text-violet-700 hover:shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
    ghost: "text-slate-600 hover:bg-violet-50 hover:text-violet-700",
    link: "text-violet-600 underline-offset-4 hover:underline hover:text-violet-700",
    minimal: "bg-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700",
    pink: "bg-pink-500 text-white hover:bg-pink-600 hover:shadow-md hover:shadow-pink-500/20",
    mint: "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-500/20",
    lavender: "bg-violet-500 text-white hover:bg-violet-600 hover:shadow-md hover:shadow-violet-500/20",
    peach: "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/20",
  }

  const sizes = {
    default: "h-11 px-6 py-2",
    sm: "h-9 rounded-xl px-4 text-xs",
    lg: "h-12 rounded-2xl px-8 text-base",
    icon: "h-11 w-11",
    xs: "h-8 rounded-xl px-3 text-xs",
  }

  const buttonVariants = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  )

  if (asChild) {
    return (
      <Comp
        ref={ref}
        className={buttonVariants}
        {...getPressMotion(shouldReduceMotion)}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      ref={ref}
      className={buttonVariants}
      {...getPressMotion(shouldReduceMotion)}
      {...props}
    >
      {children}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button }
