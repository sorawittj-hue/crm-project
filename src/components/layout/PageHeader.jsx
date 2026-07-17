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
      "relative overflow-hidden mb-6",
      "rounded-[1.75rem]",
      "border border-violet-100/70",
      "bg-white",
      "shadow-[0_4px_32px_rgba(100,80,200,0.06),0_1px_0_rgba(255,255,255,1)_inset]",
      "p-6 md:p-8",
      "transition-all duration-500",
      "hover:shadow-[0_8px_40px_rgba(100,80,200,0.10),0_1px_0_rgba(255,255,255,1)_inset]",
      className
    )}>
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.75rem]">
        {/* Primary glow */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)',
            animation: 'headerGlowMove 18s ease-in-out infinite',
          }}
        />
        {/* Secondary glow */}
        <div
          className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 65%)',
            animation: 'headerGlowMove 22s ease-in-out infinite alternate',
          }}
        />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '150px',
          }}
        />
        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.3) 30%, rgba(236,72,153,0.2) 70%, transparent 100%)'
        }} />
        {/* Dot pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes headerGlowMove {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(30px, -20px) scale(1.08); }
          66%  { transform: translate(-15px, 15px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}} />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="relative group/header-icon shrink-0">
              {/* Glow ring */}
              <div className={cn(
                "absolute -inset-1.5 rounded-2xl bg-gradient-to-br opacity-20 blur-lg transition-opacity duration-500 group-hover/header-icon:opacity-50",
                iconColor
              )} />
              {/* Icon box */}
              <div className={cn(
                "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white relative overflow-hidden",
                "shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]",
                "transition-all duration-500 group-hover/header-icon:scale-105 group-hover/header-icon:rotate-2",
                iconColor
              )}>
                {/* Inner shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover/header-icon:opacity-100 transition-opacity duration-500" />
                <Icon size={24} className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
              </div>
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                {typeof title === 'string' ? (
                  <span style={{
                    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {title}
                  </span>
                ) : title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-sm text-slate-500 mt-0.5 font-medium leading-relaxed">{description}</p>
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
        <div className="relative z-10 mt-6 pt-5 border-t border-violet-50 flex items-center gap-2 flex-wrap md:flex-nowrap">
          {children}
        </div>
      )}
    </header>
  );
}
