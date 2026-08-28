/**
 * KpiCard — Modern 2026 metric card with mini sparkline & trend badge
 */
import { useMemo } from "react";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const COLOR_MAP = {
  violet:  { bg: "kpi-violet",  accent: "#a78bfa", labelCls: "text-violet-300/80",  valueCls: "text-white",       ring: "ring-violet-500/20"  },
  emerald: { bg: "kpi-emerald", accent: "#34d399", labelCls: "text-emerald-300/80", valueCls: "text-emerald-50",  ring: "ring-emerald-500/20" },
  amber:   { bg: "kpi-amber",   accent: "#fbbf24", labelCls: "text-amber-300/80",   valueCls: "text-amber-50",    ring: "ring-amber-500/20"   },
  cyan:    { bg: "kpi-cyan",    accent: "#38bdf8", labelCls: "text-cyan-300/80",    valueCls: "text-cyan-50",     ring: "ring-cyan-500/20"    },
  rose:    { bg: "kpi-rose",    accent: "#fb7185", labelCls: "text-rose-300/80",    valueCls: "text-rose-50",     ring: "ring-rose-500/20"    },
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
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export default function KpiCard({ title, value, formatter = v => v, sparkline, trend, color = "violet", icon: Icon, sub, className }) {
  const cfg = COLOR_MAP[color] || COLOR_MAP.violet;
  const sparkPath = useMemo(() => buildSparklinePath(sparkline), [sparkline]);
  const trendPositive = trend > 0;
  const trendNeutral  = trend === 0 || trend == null;

  const lastDot = useMemo(() => {
    if (!sparkPath || !sparkline || sparkline.length < 2) return null;
    const pts = sparkPath.split(" ");
    const [lx, ly] = pts[pts.length - 1].split(",");
    return { x: parseFloat(lx), y: parseFloat(ly) };
  }, [sparkPath, sparkline]);

  return (
    <div className={cn(
      "relative rounded-2xl p-5 overflow-hidden border border-white/[0.07] ring-1 card-inset-highlight",
      cfg.bg, cfg.ring, className
    )}>
      <div className="noise-overlay absolute inset-0 rounded-2xl" />
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-25 blur-2xl pointer-events-none"
        style={{ background: cfg.accent }} />
      <div className="relative z-10 flex flex-col gap-3 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${cfg.accent}25`, color: cfg.accent }}>
                <Icon size={14} />
              </div>
            )}
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", cfg.labelCls)}>{title}</p>
          </div>
          {!trendNeutral && (
            <div className={cn("flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
              trendPositive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300")}>
              {trendPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {trendPositive ? "+" : ""}{trend?.toFixed(1)}%
            </div>
          )}
          {trendNeutral && trend != null && (
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/40 shrink-0">
              <Minus size={9} />0%
            </div>
          )}
        </div>
        {/* Value */}
        <div>
          <p className={cn("number-display text-2xl", cfg.valueCls)}>{formatter(value ?? 0)}</p>
          {sub && <p className="text-[10px] text-white/35 mt-1 font-medium">{sub}</p>}
        </div>
        {/* Sparkline */}
        {sparkPath && (
          <div className="mt-auto">
            <svg viewBox="0 0 80 28" className="w-full h-7" preserveAspectRatio="none">
              <polyline points={sparkPath} className="sparkline-path" stroke={cfg.accent} fill="none" />
              {lastDot && (
                <circle cx={lastDot.x} cy={lastDot.y} r="2.5" fill={cfg.accent}
                  style={{ filter: `drop-shadow(0 0 4px ${cfg.accent})` }} />
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
