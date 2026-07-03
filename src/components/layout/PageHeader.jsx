import React from 'react';
import { cn } from '../../lib/utils';

export default function PageHeader({ 
  icon: Icon,
  iconColor = "from-violet-500 via-indigo-500 to-purple-600",
  title, 
  description, 
  badge,
  breadcrumb,
  rightContent,
  children,
  className
}) {
  return (
    <header className={cn(
      "relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white/90 to-white/75 backdrop-blur-3xl border border-white/90 p-6 md:p-8 shadow-[0_20px_50px_rgba(139,92,246,0.03)] hover:shadow-[0_20px_50px_rgba(139,92,246,0.06)] hover:-translate-y-0.5 transition-all duration-500", 
      className
    )}>
      {/* Self-contained CSS keyframes for floating background glows */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes headerGlowMove {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .header-glow-orb-1 {
          animation: headerGlowMove 15s infinite ease-in-out;
        }
        .header-glow-orb-2 {
          animation: headerGlowMove 20s infinite ease-in-out alternate;
        }
      `}} />

      {/* Dynamic atmospheric ambient glows inside the header */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-300/15 to-indigo-200/10 rounded-full blur-3xl pointer-events-none -z-10 header-glow-orb-1" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-200/10 to-rose-200/10 rounded-full blur-3xl pointer-events-none -z-10 header-glow-orb-2" />
      
      {/* Light highlights */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="relative group/header-icon shrink-0">
              {/* Outer glow ring */}
              <div className={cn(
                "absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-30 blur-md group-hover/header-icon:opacity-60 transition-opacity duration-500",
                iconColor
              )} />
              
              {/* Main icon box */}
              <div className={cn(
                "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-md relative overflow-hidden ring-4 ring-white/80 group-hover/header-icon:scale-105 group-hover/header-icon:rotate-3 transition-all duration-500",
                iconColor
              )}>
                {/* Shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-white/0 opacity-0 group-hover/header-icon:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover/header-icon:translate-x-full" />
                <Icon size={26} className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
              </div>
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                {typeof title === 'string' ? (
                  <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent">
                    {title}
                  </span>
                ) : title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-sm text-slate-500/90 mt-0.5 font-medium tracking-wide leading-relaxed">{description}</p>
            )}
            {breadcrumb && (
              <div className="mt-2">
                {breadcrumb}
              </div>
            )}
          </div>
        </div>
        
        {rightContent && (
          <div className="w-full md:w-auto shrink-0 relative z-20">
            {rightContent}
          </div>
        )}
      </div>

      {children && (
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-100/50 flex items-center gap-2 flex-wrap md:flex-nowrap">
          {children}
        </div>
      )}
    </header>
  );
}
