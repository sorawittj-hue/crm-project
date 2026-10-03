import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, label, error, hint, icon: Icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
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
            "flex h-11 w-full rounded-lg border px-3.5 py-2 text-sm transition-colors duration-150 ease-out outline-none",
            // Light
            "bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 hover:border-slate-400 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20",
            // Dark
            "dark:bg-[#0c101a] dark:text-white dark:border-white/15 dark:placeholder:text-slate-500 dark:hover:border-white/25 dark:focus:border-violet-400 dark:focus:ring-2 dark:focus:ring-violet-400/25",
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
