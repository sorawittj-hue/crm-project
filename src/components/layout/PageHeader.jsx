import { cn } from '../../lib/utils';

export default function PageHeader({
  icon: Icon,
  iconColor = 'from-cyan-400 via-sky-500 to-indigo-600',
  title,
  description,
  badge,
  breadcrumb,
  rightContent,
  children,
  className,
}) {
  return (
    <header
      className={cn(
        'relative mb-7 overflow-hidden rounded-[28px] border border-slate-700/70',
        'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950',
        'p-5 shadow-[0_22px_55px_rgba(15,23,42,0.28)] md:p-7',
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-400/20 blur-[90px]" />
        <div className="absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[100px]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="relative shrink-0">
              <div className={cn('absolute -inset-2 rounded-[22px] bg-gradient-to-br opacity-45 blur-xl', iconColor)} />
              <div className={cn(
                'relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br text-white',
                'border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_24px_rgba(0,0,0,0.24)]',
                iconColor,
              )}>
                <Icon size={27} strokeWidth={2.4} />
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-[-0.035em] text-white lg:text-[30px]">
                {typeof title === 'string' ? title : title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-300">{description}</p>
            )}
            {breadcrumb && <div className="mt-2">{breadcrumb}</div>}
          </div>
        </div>

        {rightContent && <div className="w-full shrink-0 md:w-auto">{rightContent}</div>}
      </div>

      {children && (
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5 md:flex-nowrap">
          {children}
        </div>
      )}
    </header>
  );
}
