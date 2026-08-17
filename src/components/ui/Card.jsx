import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef(({ className, hover = true, glow = false, glass = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        // Light mode
        "bg-white/90 text-slate-900 border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] backdrop-blur-xl",
        // Dark mode
        "dark:bg-[#0f111a]/80 dark:text-slate-100 dark:border-white/[0.08] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)]",
        // Hover
        hover && "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08)] hover:border-slate-300 dark:hover:border-white/20 dark:hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.6)]",
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
