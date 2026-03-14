import { useState, useMemo } from 'react';
import { Sparkles, Plus, Cpu, ScanLine } from 'lucide-react';
import { Button } from '../ui/Button';
import DealDetailSidebar from './DealDetailSidebar';
import PDFImporter from './PDFImporter';
import { Sheet } from '../ui/Sheet';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../ui/Dialog';
import { callGeminiAPI } from '../../services/ai';
import { useTeam } from '../../hooks/useTeam';
import PipelineHeader from './PipelineHeader';
import PipelineBoard from './PipelineBoard';
import { useAppStore } from '../../store/useAppStore';

export default function MonthlyPipeline({ 
  deals, 
  onAddDeal, 
  onUpdateDeal, 
  onDeleteDeal, 
  selectedMonth: parentSelectedMonth, 
  selectedYear: parentSelectedYear, 
  onMonthChange, 
  onYearChange 
}) {
  const { data: teamMembers } = useTeam();
  const { monthlyTarget } = useAppStore();
  const [peekDeal, setPeekDeal] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  
  const [localMonth, setLocalMonth] = useState(new Date().getMonth());
  const [localYear, setLocalYear] = useState(new Date().getFullYear());
  
  const selectedMonth = parentSelectedMonth !== undefined ? parentSelectedMonth : localMonth;
  const selectedYear = parentSelectedYear !== undefined ? parentSelectedYear : localYear;
  
  // Filter deals by month/year
  const filteredDeals = useMemo(() => {
    let result = deals || [];
    result = result.filter(d => {
      const dealDate = new Date(d.createdAt || d.created_at || '1970-01-01');
      return dealDate.getMonth() === selectedMonth && dealDate.getFullYear() === selectedYear;
    });
    return result;
  }, [deals, selectedMonth, selectedYear]);

  // Calculate stats
  const monthlyTotal = filteredDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const monthlyCount = filteredDeals.length;
  const totalDeals = deals?.length || 0;
  
  // Last month calculation
  const lastMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const lastMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const lastMonthDeals = (deals || []).filter(d => {
    const dealDate = new Date(d.createdAt || d.created_at || '1970-01-01');
    return dealDate.getMonth() === lastMonth && dealDate.getFullYear() === lastMonthYear;
  });
  const lastMonthTotal = lastMonthDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <div className="h-full flex flex-col space-y-10">
      {/* HEADER WITH KPIs */}
      <PipelineHeader
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={onMonthChange || setLocalMonth}
        onYearChange={onYearChange || setLocalYear}
        monthlyTotal={monthlyTotal}
        monthlyCount={monthlyCount}
        totalDeals={totalDeals}
        monthlyTarget={monthlyTarget || 0}
        lastMonthTotal={lastMonthTotal}
      />

      {/* PIPELINE BOARD WITH NATURAL SCROLL */}
      <div className="flex-1 min-h-[600px] bg-muted/10 rounded-[3rem] p-8 border border-border/40 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 h-full">
          <PipelineBoard
            deals={filteredDeals}
            onDealClick={(deal) => { setPeekDeal(deal); setIsSidebarOpen(true); }}
            onUpdateDeal={onUpdateDeal}
            onAddDeal={onAddDeal}
            teamMembers={teamMembers}
          />
        </div>
      </div>

      {/* ADVANCED TOOLS BAR */}
      <div className="flex items-center justify-between bg-card p-4 rounded-[2rem] border border-border/40 shadow-xl shadow-black/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Cpu size={20} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Neural Integration</p>
              <p className="text-xs font-bold">Planetary Signal Extractor Ready</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="h-12 btn-zenith-outline px-6 group"
            onClick={() => setIsScanOpen(true)}
          >
            <Sparkles size={18} className="mr-2 text-primary group-hover:animate-pulse" /> AI Extract
          </Button>

          <Button
            className="h-12 btn-zenith-primary px-8"
            onClick={() => onAddDeal()}
          >
            <Plus size={20} className="mr-2" /> New Deal
          </Button>
        </div>
      </div>

      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="glass-card max-w-xl p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader className="mb-8 text-center">
              <div className="w-16 h-16 rounded-[2rem] bg-primary/20 flex items-center justify-center text-primary mx-auto mb-4 animate-reveal">
                 <ScanLine size={32} />
              </div>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter premium-gradient-text">SIGNAL EXTRACTION</DialogTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2">Neural PDF Analysis & Data Mining</p>
            </DialogHeader>
            
            <PDFImporter
              onDataExtracted={(data) => { setIsScanOpen(false); onAddDeal(data); }}
              callGeminiAPI={callGeminiAPI}
              onClose={() => setIsScanOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DealDetailSidebar
          deal={peekDeal}
          onUpdate={onUpdateDeal}
          onDelete={onDeleteDeal}
        />
      </Sheet>
    </div>
  );
}
