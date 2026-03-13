import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, TrendingUp, AlertTriangle, 
  ChevronDown, ChevronUp, MoreVertical, Zap,
  ArrowRight, ArrowLeft, Keyboard
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHorizontalScroll, usePipelineKeyboard } from '../../hooks/useHorizontalScroll';
import { calculateRiskScore } from '../../services/aiDeals';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

const STAGE_CONFIG = {
  lead: { 
    label: 'Inbound', 
    color: 'bg-blue-500', 
    borderColor: 'border-blue-500/30',
    description: 'New leads not yet engaged',
    icon: '📥',
    width: 320
  },
  contact: { 
    label: 'Engagement', 
    color: 'bg-indigo-500', 
    borderColor: 'border-indigo-500/30',
    description: 'Initial contact made',
    icon: '🤝',
    width: 320
  },
  proposal: { 
    label: 'Quotation', 
    color: 'bg-amber-500', 
    borderColor: 'border-amber-500/30',
    description: 'Proposal sent to client',
    icon: '📄',
    width: 320
  },
  negotiation: { 
    label: 'Tactical', 
    color: 'bg-orange-500', 
    borderColor: 'border-orange-500/30',
    description: 'Active negotiation phase',
    icon: '⚔️',
    width: 320
  },
  won: { 
    label: 'Closed', 
    color: 'bg-emerald-500', 
    borderColor: 'border-emerald-500/30',
    description: 'Successfully closed deals',
    icon: '✅',
    width: 320
  },
  lost: { 
    label: 'Lost', 
    color: 'bg-red-500', 
    borderColor: 'border-red-500/30',
    description: 'Lost or rejected opportunities',
    icon: '❌',
    width: 320
  },
};

const STAGES = Object.keys(STAGE_CONFIG);

// Quick filter presets
const QUICK_FILTERS = [
  { id: 'all', label: 'All Deals', icon: Filter },
  { id: 'my-deals', label: 'My Deals', icon: Star },
  { id: 'hot', label: '🔥 Hot', icon: Zap },
  { id: 'at-risk', label: '⚠️ At Risk', icon: AlertTriangle },
  { id: 'high-value', label: '💎 High Value', icon: TrendingUp },
];

export default function PipelineBoard({ 
  deals = [], 
  onDealClick, 
  onUpdateDeal, 
  onAddDeal,
  teamMembers = [] 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [pinnedDealIds, setPinnedDealIds] = useState([]);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const scrollRef = useHorizontalScroll();

  // Calculate risk scores for all deals
  const dealsWithRisk = deals.map(deal => ({
    ...deal,
    risk: calculateRiskScore(deal, [])
  }));

  // Filter deals
  const filteredDeals = dealsWithRisk.filter(deal => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        deal.title?.toLowerCase().includes(term) ||
        deal.company?.toLowerCase().includes(term) ||
        deal.assigned_to?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Quick filters
    switch (activeFilter) {
      case 'my-deals':
        return deal.assigned_to === 'leader';
      case 'hot':
        return deal.probability >= 70 || deal.risk.level === 'low';
      case 'at-risk':
        return deal.risk.level === 'high' || deal.risk.daysSinceActivity > 7;
      case 'high-value':
        return deal.value >= 1000000;
      default:
        return true;
    }
  });

  // Group deals by stage
  const dealsByStage = STAGES.reduce((acc, stageId) => {
    acc[stageId] = filteredDeals.filter(d => d.stage === stageId);
    return acc;
  }, {});

  // Move deal to different stage
  const handleMoveDeal = (dealId, direction) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const currentIndex = STAGES.indexOf(deal.stage);
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < STAGES.length) {
      onUpdateDeal(dealId, { stage: STAGES[newIndex] });
    }
  };

  // Keyboard shortcuts
  usePipelineKeyboard({
    onMoveLeft: () => selectedDealId && handleMoveDeal(selectedDealId, 'left'),
    onMoveRight: () => selectedDealId && handleMoveDeal(selectedDealId, 'right'),
    onEscape: () => setSelectedDealId(null)
  });

  // Toggle pin
  const togglePin = (dealId) => {
    setPinnedDealIds(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* TOP BAR: Search + Quick Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search deals, companies, owners... (Press / to focus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                <ChevronUp size={14} className="rotate-45" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-muted-foreground hover:text-white transition-all"
            title="Keyboard shortcuts"
          >
            <Keyboard size={14} />
            <span className="hidden lg:inline">Shortcuts</span>
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all",
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                  : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
              )}
            >
              <filter.icon size={12} />
              {filter.label}
            </button>
          ))}
          
          <div className="ml-auto text-[9px] font-black uppercase tracking-wider text-muted-foreground">
            {filteredDeals.length} deals
          </div>
        </div>
      </div>

      {/* Keyboard Help */}
      {showKeyboardHelp && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase tracking-wider text-primary">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">Shift + →</kbd>
                  <span>Move deal to next stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">Shift + ←</kbd>
                  <span>Move deal to previous stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">Esc</kbd>
                  <span>Deselect deal</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">Drag</kbd>
                  <span>Drag empty space to scroll</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="text-muted-foreground hover:text-white"
            >
              <ChevronUp size={16} className="rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* PIPPLELINE BOARD - Horizontal Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex-1 min-h-0 relative"
      >
        <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
          {STAGES.map((stageId) => {
            const stage = STAGE_CONFIG[stageId];
            const stageDeals = dealsByStage[stageId] || [];
            const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const isDropTarget = dropTarget === stageId;

            return (
              <div
                key={stageId}
                className={cn(
                  "flex-shrink-0 flex flex-col h-full rounded-3xl transition-all duration-200",
                  stage.borderColor,
                  isDropTarget && "bg-white/10 scale-[1.02] border-2"
                )}
                style={{ width: stage.width }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTarget(stageId);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropTarget(null);
                  const dealId = e.dataTransfer.getData('dealId');
                  if (dealId) {
                    onUpdateDeal(dealId, { stage: stageId });
                  }
                }}
              >
                {/* Column Header */}
                <div className={cn(
                  "p-4 sticky top-0 z-10 rounded-t-3xl backdrop-blur-md",
                  stageId === 'lost' ? "bg-red-500/10" : "bg-black/20"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stage.icon}</span>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                        {stage.label}
                      </h3>
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full",
                        stageId === 'lost' ? "bg-red-500/20 text-red-400" : "bg-white/10 text-muted-foreground"
                      )}>
                        {stageDeals.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-medium text-muted-foreground leading-tight">
                      {stage.description}
                    </p>
                    <p className="text-[9px] font-black tabular-nums text-muted-foreground">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                </div>

                {/* Cards Container - Vertical Scroll */}
                <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar space-y-3">
                  {stageDeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center mb-2",
                        stageId === 'lost' ? "bg-red-500/10" : "bg-white/5"
                      )}>
                        <span className="text-2xl">{stage.icon}</span>
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                        No deals
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {stageDeals.map((deal) => {
                        const isPinned = pinnedDealIds.includes(deal.id);
                        const isSelected = selectedDealId === deal.id;
                        const isHighRisk = deal.risk.level === 'high';

                        return (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            isSelected={isSelected}
                            isPinned={isPinned}
                            isHighRisk={isHighRisk}
                            onSelect={() => setSelectedDealId(deal.id)}
                            onClick={() => onDealClick(deal)}
                            onPin={() => togglePin(deal.id)}
                            onMove={(direction) => handleMoveDeal(deal.id, direction)}
                            onUpdate={onUpdateDeal}
                          />
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Enhanced Deal Card Component
const DealCard = React.memo(React.forwardRef(({ 
  deal, 
  isSelected, 
  isPinned, 
  isHighRisk,
  onSelect, 
  onClick, 
  onPin,
  onMove,
  onUpdate 
}, ref) => {
  const daysSinceActivity = deal.risk?.daysSinceActivity || 0;
  const isStale = daysSinceActivity > 7;
  const isCritical = daysSinceActivity > 14;

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('dealId', deal.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
        onClick(deal);
      }}
      className={cn(
        "group relative cursor-grab active:cursor-grabbing rounded-xl border transition-all duration-200 overflow-hidden",
        isSelected && "ring-2 ring-primary bg-primary/10",
        isPinned && "border-yellow-500/50 bg-yellow-500/5",
        isCritical ? "border-red-500/50 shadow-lg shadow-red-500/10" :
        isStale ? "border-amber-500/30" :
        "border-white/5 bg-white/5 hover:border-primary/30"
      )}
      data-draggable="true"
    >
      {/* Pin Indicator */}
      {isPinned && (
        <div className="absolute top-2 right-2 text-yellow-500 z-10">
          <Star size={12} fill="currentColor" />
        </div>
      )}

      {/* Risk Badge */}
      {isHighRisk && (
        <div className="absolute top-2 left-2 text-red-500 z-10">
          <AlertTriangle size={12} />
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Header: Company + Owner */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center text-[7px] font-black text-white",
            deal.assigned_to === 'leader' ? 'bg-indigo-600' : 'bg-orange-600'
          )}>
            {(deal.assigned_to || 'U').slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[9px] font-bold text-foreground truncate flex-1">
            {deal.company || 'ENTITY'}
          </p>
        </div>

        {/* Title */}
        <h4 className="text-xs font-bold leading-tight line-clamp-2 text-foreground/90">
          {deal.title}
        </h4>

        {/* Footer: Value + Activity + Probability */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div>
            <p className="text-[10px] font-black tabular-nums">
              {formatCurrency(deal.value)}
            </p>
            {deal.probability > 0 && (
              <div className="flex items-center gap-1 text-[7px] font-black text-muted-foreground uppercase">
                <TrendingUp size={8} className={
                  deal.probability >= 70 ? "text-emerald-500" : 
                  deal.probability >= 40 ? "text-amber-500" : "text-red-500"
                } />
                {deal.probability}%
              </div>
            )}
          </div>

          <div className={cn(
            "px-1.5 py-1 rounded text-[7px] font-black uppercase",
            isCritical ? "bg-red-500/20 text-red-400" :
            isStale ? "bg-amber-500/20 text-amber-400" :
            "bg-emerald-500/20 text-emerald-400"
          )}>
            {daysSinceActivity}d
          </div>
        </div>

        {/* Probability Bar */}
        {deal.probability > 0 && (
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                deal.probability >= 70 ? "bg-emerald-500" :
                deal.probability >= 40 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${deal.probability}%` }}
            />
          </div>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
        <button
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          className={cn(
            "p-2 rounded-full transition-colors",
            isPinned ? "bg-yellow-500 text-black" : "bg-white/10 text-white hover:bg-white/20"
          )}
          title={isPinned ? "Unpin" : "Pin deal"}
        >
          <Star size={14} fill={isPinned ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMove('left'); }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="Move to previous stage (Shift + ←)"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMove('right'); }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="Move to next stage (Shift + →)"
        >
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}));

DealCard.displayName = "DealCard";
