import React from 'react';
import { cn } from '../../lib/utils';

export default function PageHeader({ 
  icon: Icon,
  iconColor = "from-violet-500 to-indigo-600",
  title, 
  description, 
  badge,
  breadcrumb,
  rightContent,
  children,
  className
}) {
  return (
    <header className={cn("relative overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/80 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]", className)}>
      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.08),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shadow-violet-500/20 relative overflow-hidden group flex-shrink-0",
              iconColor
            )}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full" />
              <Icon size={26} className="relative z-10" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
              {badge}
            </div>
            {description && (
              <p className="text-sm text-slate-500 mt-0.5 font-medium">{description}</p>
            )}
            {breadcrumb && (
              <div className="mt-2">
                {breadcrumb}
              </div>
            )}
          </div>
        </div>
        
        {rightContent && (
          <div className="w-full md:w-auto">
            {rightContent}
          </div>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap relative z-10 mt-6 pt-6 border-t border-slate-100/60">
          {children}
        </div>
      )}
    </header>
  );
}
