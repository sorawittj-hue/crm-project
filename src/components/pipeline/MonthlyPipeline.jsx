import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus,
  CheckCircle2,
  AlertTriangle, Sparkles,
  PhoneCall
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import DealDetailSidebar from './DealDetailSidebar';
import PDFImporter from './PDFImporter';
import { Dialog, DialogHeader, DialogTitle } from '../ui/Dialog';
import { callGeminiAPI } from '../../services/ai';
import { useTeam } from '../../hooks/useTeam';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);
const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);

const STAGES = [
  { id: 'lead', label: 'Inbound', color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
  { id: 'contact', label: 'Engagement', color: 'bg-indigo-500', glow: 'shadow-indigo-500/20' },
  { id: 'proposal', label: 'Quotation', color: 'bg-amber-500', glow: 'shadow-amber-500/20' },
  { id: 'negotiation', label: 'Tactical', color: 'bg-orange-500', glow: 'shadow-orange-500/20' },
  { id: 'won', label: 'Closed', color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500', glow: 'shadow-red-500/20' },
];

const PipelineCard = React.memo(React.forwardRef(({ deal, onClick, onDragStart, isSelected, onUpdateDeal }, ref) => {
  const daysIdle = daysSince(deal.lastActivity || deal.createdAt);
  const isStale = daysIdle >= 2;
  const isCritical = daysIdle >= 4;

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-3"
    >
      <Card 
        draggable
        onDragStart={(e) => onDragStart(e, deal)}
        onClick={() => onClick(deal)}
        className={cn(
          "group relative cursor-grab active:cursor-grabbing border-white/5 bg-white/5 backdrop-blur-lg transition-all overflow-hidden p-0",
          isSelected && "ring-2 ring-primary bg-primary/5",
          isCritical ? "border-red-500/30" : "hover:border-primary/30"
        )}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div 
                className={cn(
                  "w-5 h-5 rounded flex items-center justify-center text-[8px] font-black text-white", 
                  deal.assigned_to === 'leader' ? 'bg-indigo-600' : 'bg-orange-600'
                )}
              >
                {deal.assigned_to === 'leader' ? 'S' : 'O'}
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[80px]">
                {deal.company || 'ENTITY'}
              </p>
            </div>
            {isCritical && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
          </div>
          
          <h4 className="text-xs font-bold leading-tight mb-3 line-clamp-2 tracking-tight uppercase">
            {deal.title}
          </h4>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[11px] font-black tabular-nums tracking-tighter text-foreground/90">
              {formatCurrency(deal.value)}
            </span>
            <div className={cn(
              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
              isCritical ? "text-red-400" : isStale ? "text-amber-400" : "text-emerald-400"
            )}>
              {daysIdle}D
            </div>
          </div>

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
             <Button 
              size="xs" 
              className="bg-primary h-7 w-7 rounded-full"
              onClick={(e) => { e.stopPropagation(); onUpdateDeal(deal.id, { lastActivity: new Date().toISOString() }); }}
             >
               <PhoneCall size={12} />
             </Button>
             <Button 
              size="xs" 
              className="bg-emerald-600 h-7 w-7 rounded-full"
              onClick={(e) => { e.stopPropagation(); onUpdateDeal(deal.id, { stage: 'won' }); }}
             >
               <CheckCircle2 size={12} />
             </Button>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div 
            className={cn("h-full", deal.probability >= 70 ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${deal.probability || 0}%` }}
          />
        </div>
      </Card>
    </motion.div>
  );
}));
PipelineCard.displayName = "PipelineCard";

const PipelineColumn = ({ stage, deals, onDealClick, onUpdateDeal, selectedDeals }) => {
  const [isOver, setIsOver] = useState(false);
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); onUpdateDeal(e.dataTransfer.getData('dealId'), { stage: stage.id }); }}
      className={cn(
        "flex-shrink-0 w-[280px] flex flex-col h-full rounded-3xl transition-colors duration-200",
        isOver ? "bg-white/5 border border-white/5" : "bg-transparent"
      )}
    >
      <div className="p-4 flex flex-col gap-2 sticky top-0 bg-black/20 backdrop-blur-md z-10 rounded-t-3xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", stage.color)} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">{stage.label}</h3>
            <span className="text-[9px] font-black bg-white/5 px-1.5 rounded-full">{deals.length}</span>
          </div>
          <span className="text-[10px] font-black tabular-nums text-muted-foreground">{formatCurrency(totalValue)}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {deals.map(deal => (
            <PipelineCard
              key={deal.id}
              deal={deal}
              onClick={onDealClick}
              onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id)}
              isSelected={selectedDeals.includes(deal.id)}
              onUpdateDeal={onUpdateDeal}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function MonthlyPipeline({ deals, onAddDeal, onUpdateDeal, onDeleteDeal }) {
  const { data: teamMembers } = useTeam();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [peekDeal, setPeekDeal] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState('all');

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (ownerFilter !== 'all') result = result.filter(d => d.assigned_to === ownerFilter);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(d => d.title?.toLowerCase().includes(s) || d.company?.toLowerCase().includes(s));
    }
    return result;
  }, [deals, searchTerm, ownerFilter]);

  const toggleSelect = (id) => {
    setSelectedDeals(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* COMPACT CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input 
              placeholder="Search..." 
              className="pl-9 h-9 w-[200px] bg-black/20 border-white/10 rounded-xl text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/5">
             <button onClick={() => setOwnerFilter('all')} className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all", ownerFilter === 'all' ? "bg-white text-black" : "text-muted-foreground")}>all</button>
             {teamMembers?.map(m => (
               <button key={m.id} onClick={() => setOwnerFilter(m.id)} className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all", ownerFilter === m.id ? "bg-white text-black" : "text-muted-foreground")}>{m.id}</button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            className="h-9 border-primary/20 bg-primary/5 text-primary rounded-xl px-4 font-black uppercase text-[9px]"
            onClick={() => setIsScanOpen(true)}
          >
            <Sparkles size={14} className="mr-2" /> AI Scan
          </Button>
          
          <Button 
            className="h-9 bg-primary text-primary-foreground rounded-xl px-4 font-black uppercase text-[9px]" 
            onClick={() => onAddDeal()}
          >
            <Plus size={16} className="mr-2" /> New Node
          </Button>
        </div>
      </div>

      {/* HORIZONTAL MATRIX */}
      <div className="flex-1 min-h-0 -mx-4 px-4 overflow-x-auto custom-scrollbar pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {STAGES.map(stage => (
            <PipelineColumn 
              key={stage.id} 
              stage={stage} 
              deals={filteredDeals.filter(d => d.stage === stage.id)}
              onDealClick={(d) => { setPeekDeal(d); setIsSidebarOpen(true); }}
              onUpdateDeal={onUpdateDeal}
              selectedDeals={selectedDeals}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      </div>

      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <div className="p-6">
          <DialogHeader className="mb-6 border-b border-white/5 pb-4">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Sparkles className="text-primary animate-pulse" /> Signal Extraction
            </DialogTitle>
          </DialogHeader>
          <PDFImporter 
            onDataExtracted={(data) => { setIsScanOpen(false); onAddDeal(data); }} 
            callGeminiAPI={callGeminiAPI} 
            onClose={() => setIsScanOpen(false)} 
          />
        </div>
      </Dialog>

      <DealDetailSidebar 
        deal={peekDeal}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        onUpdate={onUpdateDeal}
        onDelete={onDeleteDeal}
      />
    </div>
  );
}
