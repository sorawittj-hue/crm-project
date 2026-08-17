import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, label, error, hint, icon: Icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 ml-0.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-violet-500 transition-colors duration-200 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 md:h-11 w-full rounded-xl border px-3.5 md:px-4 py-2 text-sm font-medium transition-all duration-200 ease-out outline-none",
            // Light
            "bg-slate-50/90 text-slate-900 border-slate-200/90 placeholder:text-slate-400 shadow-2xs hover:bg-white hover:border-slate-300 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
            // Dark
            "dark:bg-white/[0.04] dark:text-white dark:border-white/10 dark:placeholder:text-slate-500 dark:hover:bg-white/[0.07] dark:hover:border-white/20 dark:focus:bg-[#0f111a] dark:focus:border-violet-500/80 dark:focus:ring-2 dark:focus:ring-violet-500/30",
            Icon && "pl-10",
            error && "border-rose-500 dark:border-rose-500 focus:ring-rose-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-500 ml-0.5">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 ml-0.5">{hint}</p>}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
