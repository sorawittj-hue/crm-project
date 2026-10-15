import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function PageHeader({
  icon: Icon,
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
        'relative mb-7 transition-colors duration-200',
        'py-1',
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          {Icon && (
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50 text-violet-700 shadow-[0_4px_14px_-2px_rgba(124,58,237,0.15)] dark:border-violet-400/20 dark:from-violet-500/20 dark:via-indigo-500/10 dark:to-transparent dark:text-violet-300">
              <Icon size={21} strokeWidth={2.2} />
            </div>
          )}

          <div>
            {breadcrumb && <div className="mb-1">{breadcrumb}</div>}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight text-slate-950 dark:text-white">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <div className="mt-1 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        {rightContent && <div className="w-full shrink-0 md:w-auto">{rightContent}</div>}
      </div>

      {children && (
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 dark:border-white/[0.08] pt-4 md:flex-nowrap">
          {children}
        </div>
      )}
    </motion.header>
  );
}
