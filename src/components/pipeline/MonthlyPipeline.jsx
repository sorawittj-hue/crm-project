import { useState, useMemo } from 'react';
import { Sparkles, Plus, FileText, ScanLine } from 'lucide-react';
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

      {/* PIPELINE BOARD */}
      <div className="flex-1 min-h-[600px] bg-white rounded-[3rem] p-8 border border-slate-200/60 overflow-hidden relative shadow-sm">
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

      {/* ACTION BAR */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-lg shadow-slate-200/20">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <FileText size={22} />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">Advanced Tools</p>
              <p className="text-xs font-bold text-slate-900">Import Quotation & AI Intelligence</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="h-12 rounded-full px-6 group hover:bg-slate-50 font-bold text-xs uppercase tracking-widest"
            onClick={() => setIsScanOpen(true)}
          >
            <Sparkles size={18} className="mr-2 text-primary" /> Register via AI
          </Button>

          <Button
            className="h-12 rounded-full px-8 shadow-lg shadow-primary/20 font-bold text-xs uppercase tracking-widest"
            onClick={() => onAddDeal()}
          >
            <Plus size={20} className="mr-2" /> New Project
          </Button>
        </div>
      </div>

      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem]">
          <div className="p-8">
            <DialogHeader className="mb-10 text-center">
              <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                 <ScanLine size={32} />
              </div>
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI QUOTE SCANNER</DialogTitle>
              <p className="text-xs text-slate-500 mt-2">Automatically extract deal details from your PDF quotation files.</p>
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
