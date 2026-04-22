import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const badgeVariants = {
  default: "border-transparent bg-pink-500 text-white hover:bg-pink-600",
  secondary: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
  destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
  outline: "border-pink-200 text-pink-600",
  success: "border-transparent bg-mint-500 text-white hover:bg-mint-600",
  warning: "border-transparent bg-peach-500 text-white hover:bg-peach-600",
  info: "border-transparent bg-sky-500 text-white hover:bg-sky-600",
  pink: "border-transparent bg-pink-100 text-pink-600 hover:bg-pink-200",
  mint: "border-transparent bg-mint-100 text-mint-600 hover:bg-mint-200",
  lavender: "border-transparent bg-lavender-100 text-lavender-600 hover:bg-lavender-200",
  peach: "border-transparent bg-peach-100 text-peach-600 hover:bg-peach-200",
  sky: "border-transparent bg-sky-100 text-sky-600 hover:bg-sky-200",
}

function Badge({ className, variant = "default", asChild = false, ...props }) {
  const Comp = asChild ? motion.span : "span"
  return (
    <Comp
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 hover:scale-105",
        badgeVariants[variant],
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      {...props}
    />
  )
}

export { Badge }
