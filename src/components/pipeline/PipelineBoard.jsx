import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, TrendingUp, AlertTriangle, 
  ChevronUp, Zap,
  ArrowRight, ArrowLeft, Keyboard,
  GripVertical, ShieldAlert, Cpu
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHorizontalScroll, usePipelineKeyboard } from '../../hooks/useHorizontalScroll';
import { calculateRiskScore } from '../../services/aiDeals';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

const STAGE_CONFIG = {
  lead: { 
    label: 'Inbound', 
    description: 'Lead Sector Alpha',
    icon: <Cpu size={16} />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  contact: { 
    label: 'Engagement', 
    description: 'Sector Bravo Contact',
    icon: <Star size={16} />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20'
  },
  proposal: { 
    label: 'Quotation', 
    description: 'Proposal Matrix',
    icon: <TrendingUp size={16} />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20'
  },
  negotiation: { 
    label: 'Tactical', 
    description: 'Negotiation Zone',
    icon: <Zap size={16} />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20'
  },
  won: { 
    label: 'Closed', 
    description: 'Archive Victory',
    icon: <ShieldAlert size={16} />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  },
  lost: { 
    label: 'Lost', 
    description: 'Sector Expired',
    icon: <AlertTriangle size={16} />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  },
};

const STAGES = Object.keys(STAGE_CONFIG);

const QUICK_FILTERS = [
  { id: 'all', label: 'All Signals', icon: Filter },
  { id: 'my-deals', label: 'My Units', icon: Star },
  { id: 'hot', label: 'High Yield', icon: Zap },
  { id: 'at-risk', label: 'Risk Detected', icon: AlertTriangle },
  { id: 'high-value', label: 'Tier 1 Assets', icon: TrendingUp },
];

export default function PipelineBoard({ 
  deals = [], 
  onDealClick, 
  onUpdateDeal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [pinnedDealIds, setPinnedDealIds] = useState([]);
  const [dropTarget, setDropTarget] = useState(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const scrollRef = useHorizontalScroll();

  // Pure data processing
  const processedDeals = useMemo(() => {
    // We use a fixed reference point for relative time in this render cycle
    // to ensure predictability during re-renders.
    const now = new Date().getTime(); 
    let result = deals.map(deal => ({
      ...deal,
      risk: calculateRiskScore(deal, [], now)
    }));

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(deal => 
        deal.title?.toLowerCase().includes(term) ||
        deal.company?.toLowerCase().includes(term) ||
        deal.assigned_to?.toLowerCase().includes(term)
      );
    }

    // Quick filters
    switch (activeFilter) {
      case 'my-deals':
        result = result.filter(deal => deal.assigned_to === 'leader');
        break;
      case 'hot':
        result = result.filter(deal => deal.probability >= 70 || deal.risk.level === 'low');
        break;
      case 'at-risk':
        result = result.filter(deal => deal.risk.level === 'high' || deal.risk.daysSinceActivity > 7);
        break;
      case 'high-value':
        result = result.filter(deal => Number(deal.value) >= 1000000);
        break;
      default: break;
    }

    return result;
  }, [deals, searchTerm, activeFilter]);

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    return STAGES.reduce((acc, stageId) => {
      acc[stageId] = processedDeals.filter(d => d.stage === stageId);
      return acc;
    }, {});
  }, [processedDeals]);

  const handleMoveDeal = (dealId, direction) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const currentIndex = STAGES.indexOf(deal.stage);
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < STAGES.length) {
      onUpdateDeal(dealId, { stage: STAGES[newIndex] });
    }
  };

  usePipelineKeyboard({
    onMoveLeft: () => selectedDealId && handleMoveDeal(selectedDealId, 'left'),
    onMoveRight: () => selectedDealId && handleMoveDeal(selectedDealId, 'right'),
    onEscape: () => setSelectedDealId(null)
  });

  const togglePin = (dealId) => {
    setPinnedDealIds(prev => 
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Search & Quick Filters Container */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Filter board matrix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-12 bg-background/50 border border-border/40 rounded-2xl font-bold focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-4 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  activeFilter === filter.id
                    ? "bg-primary border-transparent text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:border-border/60"
                )}
              >
                <filter.icon size={14} />
                <span className="hidden lg:block">{filter.label}</span>
              </button>
            ))}
            
            <button
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground transition-all"
              title="Keyboard Logic"
            >
              <Keyboard size={20} />
            </button>
          </div>
      </div>

      {/* Keyboard Help Panel */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 mb-4">
              <div className="flex items-start justify-between">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-1.5 rounded-xl bg-background border border-border/60 text-[10px] font-black shadow-inner">SHIFT + →</kbd>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Advance Section</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-1.5 rounded-xl bg-background border border-border/60 text-[10px] font-black shadow-inner">SHIFT + ←</kbd>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revert Section</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-1.5 rounded-xl bg-background border border-border/60 text-[10px] font-black shadow-inner">ESC</kbd>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clear Focus</span>
                  </div>
                </div>
                <button onClick={() => setShowKeyboardHelp(false)} className="text-muted-foreground hover:text-foreground">
                  <ChevronUp size={20} className="rotate-45" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HORIZONTAL SCROLL SURFACE */}
      <div 
        ref={scrollRef}
        className="flex-1 min-h-[600px] relative overflow-hidden custom-scrollbar-horizontal"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-6 h-full p-2" style={{ minWidth: 'max-content' }}>
          {STAGES.map((stageId) => {
            const stage = STAGE_CONFIG[stageId];
            const stageDeals = dealsByStage[stageId] || [];
            const totalValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            const isDropTarget = dropTarget === stageId;

            return (
              <div
                key={stageId}
                className={cn(
                  "flex-shrink-0 flex flex-col w-80 h-full rounded-[3rem] transition-all duration-500 border relative",
                  stage.borderColor,
                  isDropTarget ? "bg-primary/5 border-primary/40 scale-[1.01]" : "bg-muted/10 border-border/40"
                )}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(stageId); }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropTarget(null);
                  const dealId = e.dataTransfer.getData('dealId');
                  if (dealId) onUpdateDeal(dealId, { stage: stageId });
                }}
              >
                {/* Visual Glow */}
                <div className={cn("absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 blur-[80px] rounded-full opacity-10 transition-opacity pointer-events-none", stage.bgColor)} />

                {/* Column Header */}
                <div className="p-6 pb-2">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner transition-transform", stage.bgColor, stage.borderColor, isDropTarget && "scale-110")}>
                            <span className={stage.color}>{stage.icon}</span>
                         </div>
                         <div>
                            <h3 className="text-sm font-black uppercase tracking-widest leading-none mb-1">{stage.label}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stageDeals.length} Signals</p>
                         </div>
                      </div>
                   </div>
                   <div className="px-3 py-1.5 rounded-xl bg-background/40 border border-border/20 flex justify-between items-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Yield</p>
                      <p className="text-[10px] font-black tabular-nums">{formatCurrency(totalValue)}</p>
                   </div>
                </div>

                {/* Scrollable Cards Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar-thin">
                   <AnimatePresence mode="popLayout">
                      {stageDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          isSelected={selectedDealId === deal.id}
                          isPinned={pinnedDealIds.includes(deal.id)}
                          onSelect={() => setSelectedDealId(deal.id)}
                          onClick={() => onDealClick(deal)}
                          onPin={() => togglePin(deal.id)}
                          onMove={(dir) => handleMoveDeal(deal.id, dir)}
                        />
                      ))}
                   </AnimatePresence>
                   
                   {stageDeals.length === 0 && (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-40 border-2 border-dashed border-border/20 rounded-[2rem] flex flex-col items-center justify-center text-muted-foreground group/drop"
                     >
                        <Zap size={24} className="mb-2 opacity-20 group-hover/drop:opacity-100 group-hover/drop:text-primary transition-all duration-500" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Awaiting Input</p>
                     </motion.div>
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

const DealCard = ({ 
  deal, 
  isSelected, 
  isPinned, 
  onSelect, 
  onClick, 
  onPin,
  onMove 
}) => {
  const isHighRisk = deal.risk?.level === 'high';
  const isPriority = deal.probability >= 80;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
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
        "group relative p-4 rounded-[2rem] border transition-all duration-500 cursor-grab active:cursor-grabbing hover:shadow-2xl hover:shadow-primary/10",
        isSelected ? "bg-primary/10 border-primary ring-1 ring-primary/50" : "bg-card border-border/40 hover:border-primary/40",
        isPinned && "border-amber-500/50 bg-amber-500/[0.02] shadow-lg shadow-amber-500/5",
        isHighRisk && !isSelected && "border-destructive/40 bg-destructive/[0.02]"
      )}
    >
      {/* Visual Accent */}
      <div className={cn(
        "absolute -left-[1px] top-8 w-1 h-8 rounded-r-full transition-opacity",
        isPriority ? "bg-emerald-500" : isHighRisk ? "bg-destructive" : "bg-primary",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )} />

      {/* Content */}
      <div className="space-y-3">
         <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
               <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg", deal.assigned_to === 'leader' ? 'bg-primary' : 'bg-indigo-600')}>
                  {(deal.assigned_to || 'U').charAt(0)}
               </div>
               <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Entity</p>
                  <p className="text-[10px] font-black truncate max-w-[120px]">{deal.company || 'Unknown Consortium'}</p>
               </div>
            </div>
            <div className="flex items-center gap-1">
               {isPinned && <Star size={12} className="text-amber-500 fill-current" />}
               {isHighRisk && <ShieldAlert size={12} className="text-destructive" />}
            </div>
         </div>

         <h4 className="text-sm font-black leading-tight group-hover:text-primary transition-colors">{deal.title}</h4>

         <div className="pt-3 border-t border-border/40 flex justify-between items-end">
            <div>
               <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Capital Asset</p>
               <p className="text-xs font-black tabular-nums">{formatCurrency(deal.value)}</p>
            </div>
            <div className="text-right">
               <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Yield {deal.probability}%</p>
               <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${deal.probability}%` }}
                    className={cn(
                      "h-full rounded-full",
                      deal.probability >= 70 ? "bg-emerald-500" : deal.probability >= 40 ? "bg-amber-500" : "bg-destructive"
                    )}
                  />
               </div>
            </div>
         </div>
      </div>

      {/* ACTION OVERLAY */}
      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center gap-2">
         <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all">
            <Star size={16} fill={isPinned ? "currentColor" : "none"} />
         </button>
         <button onClick={(e) => { e.stopPropagation(); onMove('left'); }} className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <ArrowLeft size={16} />
         </button>
         <button onClick={(e) => { e.stopPropagation(); onMove('right'); }} className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <ArrowRight size={16} />
         </button>
         <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div className="px-3 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-full border border-white/20 whitespace-nowrap">
               <GripVertical size={10} className="inline mr-1" /> Tactical Control
            </div>
         </div>
      </div>
    </motion.div>
  );
};

DealCard.displayName = "DealCard";
