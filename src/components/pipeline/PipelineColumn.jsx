import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import PipelineCard from './PipelineCard';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

const STAGE_INFO = {
  lead: {
    label: 'Inbound',
    color: 'bg-blue-500',
    glow: 'shadow-blue-500/20',
    description: 'New leads not yet engaged',
    icon: '📥'
  },
  contact: {
    label: 'Engagement',
    color: 'bg-indigo-500',
    glow: 'shadow-indigo-500/20',
    description: 'Initial contact made',
    icon: '🤝'
  },
  proposal: {
    label: 'Quotation',
    color: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
    description: 'Proposal sent to client',
    icon: '📄'
  },
  negotiation: {
    label: 'Tactical',
    color: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
    description: 'Active negotiation phase',
    icon: '⚔️'
  },
  won: {
    label: 'Closed',
    color: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20',
    description: 'Successfully closed deals',
    icon: '✅'
  },
  lost: {
    label: 'Lost',
    color: 'bg-red-500',
    glow: 'shadow-red-500/20',
    description: 'Lost or rejected opportunities',
    icon: '❌'
  },
};

const PipelineColumn = ({ stage, deals, onDealClick, onUpdateDeal, selectedDeals, teamMembers }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const dealCount = deals.length;
  const stageInfo = STAGE_INFO[stage.id] || STAGE_INFO.lead;
  const isLost = stage.id === 'lost';

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onUpdateDeal(e.dataTransfer.getData('dealId'), { stage: stage.id });
      }}
      animate={{
        scale: isOver ? 1.02 : 1,
        borderColor: isOver ? 'rgba(139, 115, 85, 0.5)' : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isOver ? '0 0 20px rgba(139, 115, 85, 0.3)' : '0 0 0px rgba(0, 0, 0, 0)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        "flex-shrink-0 w-[320px] flex flex-col h-full rounded-3xl transition-all duration-300",
        isOver ? "bg-primary/10" : "bg-white/5 border border-white/5",
        isLost && "bg-red-500/5 border-red-500/20"
      )}
    >
      {/* HEADER */}
      <div
        className={cn(
          "p-4 flex flex-col gap-2 sticky top-0 z-10 cursor-pointer transition-colors",
          isLost ? "bg-red-500/10" : "bg-black/20",
          isCollapsed && "rounded-b-3xl"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{stageInfo.icon}</span>
            <div className={cn("w-2 h-2 rounded-full", stageInfo.color)} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
              {stageInfo.label}
            </h3>
            <span className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded-full",
              isLost ? "bg-red-500/20 text-red-400" : "bg-white/10 text-muted-foreground"
            )}>
              {dealCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tabular-nums text-muted-foreground">
              {formatCurrency(totalValue)}
            </span>
            {isCollapsed ? (
              <ChevronDown size={14} className="text-muted-foreground" />
            ) : (
              <ChevronUp size={14} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-[8px] font-medium text-muted-foreground leading-tight">
          {stageInfo.description}
        </p>

        {/* Summary Stats */}
        {!isCollapsed && dealCount > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-white/5 mt-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">
              {dealCount} {dealCount === 1 ? 'deal' : 'deals'}
            </span>
            {isLost && (
              <div className="flex items-center gap-1 text-[8px] font-black text-red-400">
                <AlertCircle size={10} />
                <span>Review reasons</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARDS */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar"
          >
            {deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", isLost ? "bg-red-500/10" : "bg-white/5")}>
                  <span className="text-2xl">{stageInfo.icon}</span>
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                  No deals in {stageInfo.label}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deals.map(deal => (
                  <PipelineCard
                    key={deal.id}
                    deal={deal}
                    onClick={onDealClick}
                    onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id)}
                    isSelected={selectedDeals.includes(deal.id)}
                    onUpdateDeal={onUpdateDeal}
                    teamMembers={teamMembers}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PipelineColumn;
