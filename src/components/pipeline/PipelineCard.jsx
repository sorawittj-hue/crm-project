import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, PhoneCall, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

const STAGE_AGING_THRESHOLD = {
  warning: 7,
  critical: 14
};

export const PipelineCard = React.memo(React.forwardRef(({
  deal,
  onClick,
  onDragStart,
  isSelected,
  onUpdateDeal,
  teamMembers
}, ref) => {
  const daysInStage = daysSince(deal.last_activity || deal.lastActivity || deal.createdAt || deal.created_at);
  const isStale = daysInStage >= STAGE_AGING_THRESHOLD.warning;
  const isCritical = daysInStage >= STAGE_AGING_THRESHOLD.critical;

  const owner = teamMembers?.find(m => m.id === deal.assigned_to);
  const probability = deal.probability || 0;

  // Normalize Thai text spacing
  const normalizeText = (text) => {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  };

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="mb-3"
    >
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, deal)}
        onClick={() => onClick(deal)}
        className={cn(
          "group relative cursor-grab active:cursor-grabbing border border-white/5 bg-white/5 backdrop-blur-lg transition-all overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
          isSelected && "ring-2 ring-primary bg-primary/10",
          isCritical && "border-red-500/30 shadow-lg shadow-red-500/10",
          isStale && !isCritical && "border-amber-500/30"
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* HEADER: Company + Owner + Stale Indicator */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black text-white flex-shrink-0",
                  deal.assigned_to === 'leader' ? 'bg-indigo-600' : 'bg-orange-600'
                )}
                title={owner?.name || deal.assigned_to}
              >
                {(owner?.name || deal.assigned_to || 'U').slice(0, 2).toUpperCase()}
              </div>
              <p className="text-[10px] font-bold text-foreground truncate flex-1" title={normalizeText(deal.company)}>
                {normalizeText(deal.company) || 'ENTITY'}
              </p>
            </div>

            {isCritical && (
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0 animate-pulse" title="Critical: No activity for 14+ days" />
            )}
            {isStale && !isCritical && (
              <Clock size={14} className="text-amber-500 flex-shrink-0" title={`Stale: ${daysInStage} days inactive`} />
            )}
          </div>

          {/* TITLE */}
          <h4
            className="text-xs font-bold leading-tight line-clamp-2 tracking-tight text-foreground/90 min-h-[2.5rem]"
            title={normalizeText(deal.title)}
          >
            {normalizeText(deal.title)}
          </h4>

          {/* FOOTER: Value + Probability + Days */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-[11px] font-black tabular-nums tracking-tighter text-foreground">
                {formatCurrency(deal.value)}
              </span>
              {probability > 0 && (
                <div className="flex items-center gap-1 text-[8px] font-black text-muted-foreground uppercase tracking-wider">
                  <TrendingUp size={8} className={cn(
                    probability >= 70 ? "text-emerald-500" : probability >= 40 ? "text-amber-500" : "text-red-500"
                  )} />
                  {probability}% win
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className={cn(
                "px-1.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider tabular-nums",
                isCritical ? "bg-red-500/20 text-red-400" :
                  isStale ? "bg-amber-500/20 text-amber-400" :
                    "bg-emerald-500/20 text-emerald-400"
              )}>
                {daysInStage}d
              </div>
            </div>
          </div>

          {/* PROBABILITY BAR */}
          {probability > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  probability >= 70 ? "bg-emerald-500" :
                    probability >= 40 ? "bg-amber-500" :
                      "bg-red-500"
                )}
                style={{ width: `${probability}%` }}
              />
            </div>
          )}

          {/* HOVER ACTIONS */}
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
            <Button
              size="xs"
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/80"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateDeal(deal.id, { last_activity: new Date().toISOString() });
              }}
              title="Log Activity"
            >
              <PhoneCall size={12} />
            </Button>
            <Button
              size="xs"
              className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateDeal(deal.id, { stage: 'won' });
              }}
              title="Mark as Won"
            >
              <CheckCircle2 size={12} />
            </Button>
          </div>
        </CardContent>

        {/* STALE INDICATOR STRIPE */}
        {isStale && (
          <div className={cn(
            "absolute top-0 right-0 w-1 h-full",
            isCritical ? "bg-red-500" : "bg-amber-500"
          )} />
        )}
      </Card>
    </motion.div>
  );
}));

PipelineCard.displayName = "PipelineCard";

export default PipelineCard;
