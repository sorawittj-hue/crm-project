import * as React from "react"
import { cn } from "../../lib/utils"
import { motion, useReducedMotion } from "framer-motion"
import { getCardMotion } from "../../lib/motion"

const Card = React.forwardRef(({ className, asChild = false, hover = true, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()
  const Comp = asChild ? motion.div : "div"
  const motionProps = asChild ? getCardMotion(shouldReduceMotion) : {}

  return (
    <Comp
      ref={ref}
      {...motionProps}
      className={cn(
        "rounded-2xl border border-slate-100 bg-white text-card-foreground shadow-sm",
        hover && "transition-all duration-200 ease-out hover:shadow-md hover:border-violet-200",
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
    className={cn("flex flex-col space-y-3 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-tight tracking-tight",
      "transition-colors duration-300",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
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
