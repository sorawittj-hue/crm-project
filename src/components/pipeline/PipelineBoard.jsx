import { useState, useMemo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, TrendingUp, AlertTriangle, 
  Zap,
  ArrowRight, ArrowLeft, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHorizontalScroll, usePipelineKeyboard } from '../../hooks/useHorizontalScroll';
import { calculateRiskScore } from '../../services/aiDeals';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

const STAGE_CONFIG = {
  lead: { 
    label: 'New Lead', 
    description: 'Initial pipeline entry',
    icon: <Search size={16} />,
    color: 'text-slate-900',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
  contact: { 
    label: 'Meeting', 
    description: 'First engagement',
    icon: <Users size={16} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  proposal: { 
    label: 'Quotation', 
    description: 'Quote provided',
    icon: <TrendingUp size={16} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  negotiation: { 
    label: 'Closing', 
    description: 'Final negotiations',
    icon: <Zap size={16} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  won: { 
    label: 'Won', 
    description: 'Successfully closed',
    icon: <ThumbsUp size={16} />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100/50',
    borderColor: 'border-emerald-300'
  },
  lost: { 
    label: 'Lost', 
    description: 'Opportunity missed',
    icon: <ThumbsDown size={16} />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200'
  },
};

const STAGES = Object.keys(STAGE_CONFIG);

const QUICK_FILTERS = [
  { id: 'all', label: 'All Projects', icon: Filter },
  { id: 'my-deals', label: 'My Pipeline', icon: Star },
  { id: 'high-value', label: 'Tier A', icon: TrendingUp },
  { id: 'at-risk', label: 'Stagnant', icon: AlertTriangle },
];

function Users({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

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
  
  // Win/Loss Reason State
  const [reasonModal, setReasonModal] = useState({ open: false, dealId: null, targetStage: null });
  const [reasonText, setReasonText] = useState('');

  const scrollRef = useHorizontalScroll();

  const processedDeals = useMemo(() => {
    const now = new Date(); 
    let result = deals.map(deal => {
      const createdDate = new Date(deal.createdAt || deal.created_at || now);
      const agingDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      return {
        ...deal,
        risk: calculateRiskScore(deal, [], now.getTime()),
        agingDays
      };
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(deal => 
        deal.title?.toLowerCase().includes(term) ||
        deal.company?.toLowerCase().includes(term)
      );
    }

    switch (activeFilter) {
      case 'my-deals': result = result.filter(deal => deal.assigned_to === 'leader'); break;
      case 'high-value': result = result.filter(deal => Number(deal.value) >= 1000000); break;
      case 'at-risk': result = result.filter(deal => deal.agingDays > 7 && !['won', 'lost'].includes(deal.stage)); break;
      default: break;
    }
    return result;
  }, [deals, searchTerm, activeFilter]);

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
      const targetStage = STAGES[newIndex];
      initiateMove(dealId, targetStage);
    }
  };

  const initiateMove = (dealId, targetStage) => {
    if (targetStage === 'won' || targetStage === 'lost') {
      setReasonModal({ open: true, dealId, targetStage });
      setReasonText('');
    } else {
      onUpdateDeal(dealId, { 
        stage: targetStage,
        lastActivity: new Date().toISOString()
      });
    }
  };

  const submitReason = () => {
    if (reasonText.trim().length < 5) {
      alert("Please provide a more detailed reason.");
      return;
    }
    onUpdateDeal(reasonModal.dealId, {
      stage: reasonModal.targetStage,
      lastActivity: new Date().toISOString(),
      closingReason: reasonText,
      closedAt: new Date().toISOString()
    });
    setReasonModal({ open: false, dealId: null, targetStage: null });
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
      <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search projects by name or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-12 bg-slate-50 border-none rounded-full font-bold focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-6 h-12 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeFilter === filter.id
                    ? "bg-primary text-white shadow-lg"
                    : "bg-slate-50 text-slate-400 hover:text-slate-900"
                )}
              >
                <filter.icon size={14} />
                <span className="hidden lg:block">{filter.label}</span>
              </button>
            ))}
          </div>
      </div>

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
                  "flex-shrink-0 flex flex-col w-80 h-full rounded-[2.5rem] transition-all duration-300 border relative",
                  isDropTarget ? "bg-slate-50 border-primary" : "bg-slate-50/50 border-slate-200/60"
                )}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(stageId); }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropTarget(null);
                  const dealId = e.dataTransfer.getData('dealId');
                  if (dealId) initiateMove(dealId, stageId);
                }}
              >
                <div className="p-6 pb-2">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border bg-white shadow-sm", isDropTarget && "scale-110")}>
                            <span className={stage.color}>{stage.icon}</span>
                         </div>
                         <div>
                            <h3 className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-slate-900">{stage.label}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stageDeals.length} Deals</p>
                         </div>
                      </div>
                   </div>
                   <div className="px-4 py-2 rounded-2xl bg-white border border-slate-100 flex justify-between items-center shadow-sm">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Value</p>
                      <p className="text-[11px] font-black tabular-nums text-slate-900">{formatCurrency(totalValue)}</p>
                   </div>
                </div>

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
                     <div className="h-40 border-2 border-dashed border-slate-200/60 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                        <p className="text-[9px] font-black uppercase tracking-widest">No Projects</p>
                     </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WIN/LOSS REASON MODAL */}
      <Dialog open={reasonModal.open} onOpenChange={(val) => !val && setReasonModal({ ...reasonModal, open: false })}>
        <DialogContent className="max-w-md rounded-[2rem] p-8">
           <DialogHeader className="mb-6">
              <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center mb-4 mx-auto", 
                reasonModal.targetStage === 'won' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
              )}>
                {reasonModal.targetStage === 'won' ? <ThumbsUp size={32} /> : <ThumbsDown size={32} />}
              </div>
              <DialogTitle className="text-2xl font-black text-center uppercase tracking-tight">
                {reasonModal.targetStage === 'won' ? 'Congratulations!' : 'Project Unresolved'}
              </DialogTitle>
              <p className="text-xs text-center text-slate-500 mt-2">
                Please provide a brief reason for closing this deal. This helps us improve our sales strategy.
              </p>
           </DialogHeader>
           
           <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Closing Reason</label>
              <Textarea 
                placeholder={reasonModal.targetStage === 'won' ? "e.g. Better pricing than competitors, Strong relationship..." : "e.g. Budget cuts, Chose competitor X..."}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className="min-h-[120px] rounded-2xl bg-slate-50 border-none resize-none p-4 font-medium"
              />
           </div>

           <DialogFooter className="mt-8 flex gap-3">
              <Button variant="ghost" className="flex-1 rounded-full" onClick={() => setReasonModal({ open: false, dealId: null, targetStage: null })}>Cancel</Button>
              <Button className={cn("flex-1 rounded-full py-6", reasonModal.targetStage === 'won' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")} onClick={submitReason}>
                Confirm Closing
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const DealCard = forwardRef(({ 
  deal, 
  isSelected, 
  isPinned, 
  onSelect, 
  onClick, 
  onPin,
  onMove 
}, ref) => {
  const isStagnant = deal.agingDays > 7;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
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
        "group relative p-5 rounded-[1.8rem] border transition-all duration-300 cursor-grab active:cursor-grabbing hover:shadow-lg",
        isSelected ? "bg-white border-primary shadow-md" : "bg-white border-slate-200/60 hover:border-slate-300",
        isPinned && "bg-amber-50/30 border-amber-200",
        isStagnant && !isSelected && !['won', 'lost'].includes(deal.stage) && "bg-rose-50/10 border-rose-100"
      )}
    >
      <div className="space-y-4">
         <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
               <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm", deal.assigned_to === 'leader' ? 'bg-slate-900 shadow-slate-900/10' : 'bg-slate-400')}>
                  {(deal.assigned_to || 'U').charAt(0)}
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 leading-none mb-1 uppercase tracking-tight">{deal.company || 'Private Client'}</p>
               </div>
            </div>
            {isPinned && <Star size={12} className="text-amber-500 fill-current" />}
         </div>

         <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-900 leading-snug group-hover:text-primary transition-colors">{deal.title}</h4>
            <div className="flex items-center gap-2">
               <p className="text-[9px] font-bold text-slate-400">Aging: <span className={cn(deal.agingDays > 5 ? "text-amber-600" : "text-emerald-600")}>{deal.agingDays}d</span></p>
               {isStagnant && !['won', 'lost'].includes(deal.stage) && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
            </div>
         </div>

         <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Value</p>
               <p className="text-xs font-black text-slate-900">{formatCurrency(deal.value)}</p>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{deal.probability}% Confidence</p>
               <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", deal.probability >= 70 ? "bg-emerald-500" : deal.probability >= 40 ? "bg-amber-500" : "bg-rose-500")}
                    style={{ width: `${deal.probability}%` }}
                  />
               </div>
            </div>
         </div>
      </div>

      {/* GENTLE OVERLAY */}
      <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] rounded-[1.8rem] flex items-center justify-center gap-2">
         <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-amber-50 hover:text-amber-600"><Star size={16} fill={isPinned ? "currentColor" : "none"} /></button>
         <button onClick={(e) => { e.stopPropagation(); onMove('left'); }} className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-900 hover:text-white"><ArrowLeft size={16} /></button>
         <button onClick={(e) => { e.stopPropagation(); onMove('right'); }} className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-900 hover:text-white"><ArrowRight size={16} /></button>
      </div>
    </motion.div>
  );
});

DealCard.displayName = 'DealCard';
