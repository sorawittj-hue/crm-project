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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200/80 bg-violet-50 text-violet-700 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
                <Icon size={20} strokeWidth={2} />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-slate-950 dark:text-white">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <div className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {description}
              </div>
            )}
            {breadcrumb && <div className="mt-2">{breadcrumb}</div>}
          </div>
        </div>

        {rightContent && <div className="w-full shrink-0 md:w-auto">{rightContent}</div>}
      </div>

      {children && (
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-white/10 pt-4 md:flex-nowrap">
          {children}
        </div>
      )}
    </motion.header>
  );
}
