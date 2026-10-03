import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef(({ className, hover = true, glow = false, glass = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border transition-colors duration-200",
        // Light mode
        "bg-white text-slate-900 border-slate-200 shadow-sm",
        // Dark mode
        "dark:bg-[#111522] dark:text-slate-100 dark:border-white/[0.08] dark:shadow-none",
        // Hover
        hover && "hover:border-slate-300 hover:shadow-md dark:hover:border-white/15 dark:hover:bg-[#141927]",
        glow && "border-violet-500/30 dark:border-violet-500/40 shadow-glow-brand",
        glass && "bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border-white/60 dark:border-white/10",
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 md:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base md:text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 md:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 md:p-6 pt-0 border-t border-slate-100 dark:border-white/5 mt-auto", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
