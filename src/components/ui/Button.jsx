import * as React from "react"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? React.Fragment : motion.button

  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variants = {
    default: "bg-pink-500 text-white hover:bg-pink-600 hover:shadow-pink-glow hover:-translate-y-0.5 active:scale-[0.98]",
    destructive: "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]",
    outline: "border-2 border-pink-200 bg-white hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 hover:shadow-md hover:-translate-y-0.5",
    secondary: "bg-mint-100 text-mint-700 hover:bg-mint-200 hover:shadow-md hover:-translate-y-0.5",
    ghost: "hover:bg-pink-50 hover:text-pink-600",
    link: "text-pink-500 underline-offset-4 hover:underline hover:text-pink-600",
    minimal: "bg-transparent hover:bg-pink-50",
    pink: "bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600 hover:shadow-pink-glow hover:-translate-y-0.5",
    mint: "bg-gradient-to-r from-mint-400 to-mint-500 text-white hover:from-mint-500 hover:to-mint-600 hover:shadow-mint-glow hover:-translate-y-0.5",
    lavender: "bg-gradient-to-r from-lavender-400 to-lavender-500 text-white hover:from-lavender-500 hover:to-lavender-600 hover:shadow-lavender-glow hover:-translate-y-0.5",
    peach: "bg-gradient-to-r from-peach-400 to-peach-500 text-white hover:from-peach-500 hover:to-peach-600 hover:shadow-lg hover:-translate-y-0.5",
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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
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
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      {...props}
    >
      {children}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button }
