import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function PageHeader({
  icon: Icon,
  iconColor = 'from-violet-600 to-indigo-600',
  title,
  description,
  badge,
  breadcrumb,
  rightContent,
  children,
  className,
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative mb-6 overflow-hidden rounded-2xl md:rounded-3xl border transition-all duration-300',
        // Light mode
        'bg-white/80 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-xl',
        // Dark mode
        'dark:bg-[#0f111a]/85 dark:border-white/10 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]',
        'p-5 md:p-6 lg:p-7',
        className,
      )}
    >
      {/* Subtle Aurora Ambient Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-[70px]" />
        <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[80px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 dark:via-violet-400/50 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="relative shrink-0">
              <div className={cn('absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-40 blur-md', iconColor)} />
              <div className={cn(
                'relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl text-white shadow-md',
                'border border-white/20 bg-gradient-to-br',
                iconColor,
              )}>
                <Icon size={24} className="md:w-7 md:h-7" strokeWidth={2.2} />
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <div className="mt-1 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {description}
              </div>
            )}
            {breadcrumb && <div className="mt-2">{breadcrumb}</div>}
          </div>
        </div>

        {rightContent && <div className="w-full shrink-0 md:w-auto">{rightContent}</div>}
      </div>

      {children && (
        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200/60 dark:border-white/10 pt-4 md:flex-nowrap">
          {children}
        </div>
      )}
    </motion.header>
  );
}
