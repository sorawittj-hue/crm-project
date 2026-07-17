import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef(({ className, hover = true, glow = false, glass = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[1.5rem] border bg-white text-card-foreground",
        "border-violet-100/60",
        "shadow-[0_2px_16px_rgba(100,80,200,0.04),0_1px_0_rgba(255,255,255,1)_inset]",
        hover && "transition-all duration-300 ease-out hover:shadow-[0_12px_40px_rgba(100,80,200,0.10),0_1px_0_rgba(255,255,255,1)_inset] hover:border-violet-200/80 hover:-translate-y-0.5",
        glow && "shadow-[0_2px_16px_rgba(100,80,200,0.04),0_0_0_1px_rgba(139,92,246,0.08),0_1px_0_rgba(255,255,255,1)_inset]",
        glass && "bg-white/70 backdrop-blur-xl border-white/80",
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
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-tight tracking-tight text-slate-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500 font-medium", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
