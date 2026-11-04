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
        'crm-page-header relative mb-6 border-b border-slate-200 pb-5 dark:border-white/10',
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          {Icon && (
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50 via-white to-teal-50 text-teal-700 shadow-[0_4px_14px_-2px_rgba(15,118,110,0.15)] dark:border-teal-400/20 dark:from-teal-500/20 dark:via-teal-500/10 dark:to-transparent dark:text-teal-300">
              <Icon size={21} strokeWidth={2.2} />
            </div>
          )}

          <div>
            {breadcrumb && <div className="mb-1">{breadcrumb}</div>}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-slate-950 dark:text-white">
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
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200/80 dark:border-white/[0.08] pt-3 md:flex-wrap">
          {children}
        </div>
      )}
    </motion.header>
  );
}
