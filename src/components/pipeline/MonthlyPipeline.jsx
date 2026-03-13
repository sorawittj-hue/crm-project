import React, { useState, useMemo } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import DealDetailSidebar from './DealDetailSidebar';
import PDFImporter from './PDFImporter';
import { Dialog, DialogHeader, DialogTitle } from '../ui/Dialog';
import { callGeminiAPI } from '../../services/ai';
import { useTeam } from '../../hooks/useTeam';
import PipelineHeader from './PipelineHeader';
import PipelineBoard from './PipelineBoard';
import { useAppStore } from '../../store/useAppStore';

const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);

const STAGES = [
  { id: 'lead', label: 'Inbound', color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
  { id: 'contact', label: 'Engagement', color: 'bg-indigo-500', glow: 'shadow-indigo-500/20' },
  { id: 'proposal', label: 'Quotation', color: 'bg-amber-500', glow: 'shadow-amber-500/20' },
  { id: 'negotiation', label: 'Tactical', color: 'bg-orange-500', glow: 'shadow-orange-500/20' },
  { id: 'won', label: 'Closed', color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500', glow: 'shadow-red-500/20' },
];

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
  
  // Use parent props if provided, otherwise use local state
  const [localMonth, setLocalMonth] = useState(new Date().getMonth());
  const [localYear, setLocalYear] = useState(new Date().getFullYear());
  
  const selectedMonth = parentSelectedMonth !== undefined ? parentSelectedMonth : localMonth;
  const selectedYear = parentSelectedYear !== undefined ? parentSelectedYear : localYear;
  const handleMonthChange = onMonthChange || setLocalMonth;
  const handleYearChange = onYearChange || setLocalYear;

  // Filter deals by month/year
  const filteredDeals = useMemo(() => {
    let result = deals || [];
    result = result.filter(d => {
      const dealDate = new Date(d.createdAt || Date.now());
      return dealDate.getMonth() === selectedMonth && dealDate.getFullYear() === selectedYear;
    });
    return result;
  }, [deals, selectedMonth, selectedYear]);

  // Calculate stats
  const monthlyTotal = filteredDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const monthlyCount = filteredDeals.length;
  const totalDeals = deals?.length || 0;
  
  // Last month calculation
  const lastMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const lastMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const lastMonthDeals = (deals || []).filter(d => {
    const dealDate = new Date(d.createdAt || Date.now());
    return dealDate.getMonth() === lastMonth && dealDate.getFullYear() === lastMonthYear;
  });
  const lastMonthTotal = lastMonthDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* HEADER WITH KPIs */}
      <PipelineHeader
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        monthlyTotal={monthlyTotal}
        monthlyCount={monthlyCount}
        totalDeals={totalDeals}
        monthlyTarget={monthlyTarget || 0}
        lastMonthTotal={lastMonthTotal}
      />

      {/* PIPELINE BOARD WITH NATURAL SCROLL */}
      <div className="flex-1 min-h-0">
        <PipelineBoard
          deals={filteredDeals}
          onDealClick={(deal) => { setPeekDeal(deal); setIsSidebarOpen(true); }}
          onUpdateDeal={onUpdateDeal}
          onAddDeal={onAddDeal}
          teamMembers={teamMembers}
        />
      </div>

      {/* AI SCAN DIALOG */}
      <div className="flex items-center justify-end gap-2">
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
          <Plus size={16} className="mr-2" /> New Deal
        </Button>
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
