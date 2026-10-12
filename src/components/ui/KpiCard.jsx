/**
 * KpiCard — Modern 2026 metric card with mini sparkline, trend badge & motion graphic
 */
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { hoverLiftSoft } from "../../lib/animations";

const COLOR_MAP = {
  violet: {
    lightBg: "bg-white/80 border-slate-200/80 shadow-sm",
    darkBg: "dark:bg-[#111522]/90 dark:border-white/[0.08]",
    accent: "#7c3aed",
    darkAccent: "#a78bfa",
    labelCls: "text-violet-700 dark:text-violet-300/90",
    valueCls: "text-slate-900 dark:text-white",
    barCls: "stat-bar-violet"
  },
  emerald: {
    lightBg: "bg-white/80 border-slate-200/80 shadow-sm",
    darkBg: "dark:bg-[#111522]/90 dark:border-white/[0.08]",
    accent: "#059669",
    darkAccent: "#34d399",
    labelCls: "text-emerald-700 dark:text-emerald-300/90",
    valueCls: "text-slate-900 dark:text-emerald-50",
    barCls: "stat-bar-emerald"
  },
  amber: {
    lightBg: "bg-white/80 border-slate-200/80 shadow-sm",
    darkBg: "dark:bg-[#111522]/90 dark:border-white/[0.08]",
    accent: "#d97706",
    darkAccent: "#fbbf24",
    labelCls: "text-amber-700 dark:text-amber-300/90",
    valueCls: "text-slate-900 dark:text-amber-50",
    barCls: "stat-bar-amber"
  },
  cyan: {
    lightBg: "bg-white/80 border-slate-200/80 shadow-sm",
    darkBg: "dark:bg-[#111522]/90 dark:border-white/[0.08]",
    accent: "#0284c7",
    darkAccent: "#38bdf8",
    labelCls: "text-cyan-700 dark:text-cyan-300/90",
    valueCls: "text-slate-900 dark:text-cyan-50",
    barCls: "stat-bar-cyan"
  },
  rose: {
    lightBg: "bg-white/80 border-slate-200/80 shadow-sm",
    darkBg: "dark:bg-[#111522]/90 dark:border-white/[0.08]",
    accent: "#e11d48",
    darkAccent: "#fb7185",
    labelCls: "text-rose-700 dark:text-rose-300/90",
    valueCls: "text-slate-900 dark:text-rose-50",
    barCls: "stat-bar-rose"
  },
};

function buildSparklinePath(data) {
  if (!data || data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 80, H = 28, PAD = 2;
  return data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${Number(x).toFixed(1)},${Number(y).toFixed(1)}`;
  }).join(" ");
}

export default function KpiCard({ title, value, formatter = v => v, sparkline, trend, color = "violet", icon: Icon, sub, className }) {
  const cfg = COLOR_MAP[color] || COLOR_MAP.violet;
  const shouldReduceMotion = useReducedMotion();

  const trendNum = trend != null ? parseFloat(trend) : null;
  const safeTrend = (trendNum != null && !isNaN(trendNum)) ? trendNum : null;
  const safeSparkline = Array.isArray(sparkline)
    ? sparkline.map(v => (v != null && !isNaN(parseFloat(v)) ? parseFloat(v) : 0))
    : undefined;
  const sparkPath = useMemo(() => buildSparklinePath(safeSparkline), [safeSparkline]);
  const trendPositive = safeTrend != null && safeTrend > 0;
  const trendNeutral  = safeTrend === 0 || safeTrend == null;

  const lastDot = useMemo(() => {
    if (!sparkPath || !safeSparkline || safeSparkline.length < 2) return null;
    const pts = sparkPath.split(" ");
    const [lx, ly] = pts[pts.length - 1].split(",");
    return { x: parseFloat(lx), y: parseFloat(ly) };
  }, [sparkPath, safeSparkline]);

  const motionProps = shouldReduceMotion
    ? {}
    : {
        whileHover: { y: -3, scale: 1.015 },
        whileTap: { scale: 0.98 },
        transition: { type: 'spring', stiffness: 450, damping: 30 }
      };

  return (
    <motion.div
      {...motionProps}
      className={cn(
        "relative rounded-2xl p-4 md:p-5 overflow-hidden border backdrop-blur-xl transition-all duration-300 card-glow-overlay hover-lift",
        cfg.lightBg, cfg.darkBg, className
      )}
    >
      {/* 3px Top Accent Bar */}
      <div className={cn("absolute top-0 inset-x-0 h-[3px] rounded-t-2xl opacity-90", cfg.barCls)} />

      {/* Decorative ambient glow orb */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-15 dark:opacity-20 blur-2xl pointer-events-none"
        style={{ background: cfg.accent }}
      />

      <div className="relative z-10 flex flex-col gap-2.5 md:gap-3 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105"
                style={{ background: `${cfg.accent}18`, color: cfg.accent }}
              >
                <Icon size={15} />
              </div>
            )}
            <p className={cn("text-[11px] font-bold uppercase tracking-wider", cfg.labelCls)}>{title}</p>
          </div>
          {!trendNeutral && safeTrend != null && (
            <div className={cn(
              "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 shadow-2xs",
              trendPositive
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
            )}>
              {trendPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {trendPositive ? "+" : ""}{safeTrend.toFixed(1)}%
            </div>
          )}
          {trendNeutral && safeTrend === 0 && (
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40 shrink-0">
              <Minus size={9} />0%
            </div>
          )}
        </div>

        {/* Value */}
        <div>
          <p className={cn("number-display text-xl md:text-2xl tracking-tight", cfg.valueCls)}>
            {formatter(value ?? 0)}
          </p>
          {sub && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{sub}</p>
          )}
        </div>

        {/* Sparkline */}
        {sparkPath && (
          <div className="mt-auto pt-1">
            <svg viewBox="0 0 80 28" className="w-full h-6 md:h-7" preserveAspectRatio="none">
              <polyline points={sparkPath} className="sparkline-path" stroke={cfg.accent} fill="none" strokeWidth={2} />
              {lastDot && (
                <circle
                  cx={lastDot.x}
                  cy={lastDot.y}
                  r="2.5"
                  fill={cfg.accent}
                  style={{ filter: `drop-shadow(0 0 4px ${cfg.accent})` }}
                />
              )}
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}
