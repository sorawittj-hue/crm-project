import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, label, error, hint, icon: Icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-0.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors duration-200 pointer-events-none">
            <Icon size={15} />
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-800",
            "border-slate-200 placeholder:text-slate-300",
            "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "transition-all duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-1",
            "focus-visible:border-violet-400 focus-visible:bg-white",
            "hover:border-violet-200",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
            "shadow-sm hover:shadow",
            Icon && "pl-10",
            error && "border-rose-300 focus-visible:ring-rose-400/50 focus-visible:border-rose-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {/* Bottom gradient accent on focus */}
        <div className="absolute bottom-0 left-2 right-2 h-px rounded-full bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
      </div>
      {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-500 ml-0.5">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-[11px] font-medium text-slate-400 ml-0.5">{hint}</p>}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
