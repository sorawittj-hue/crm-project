import { useState, useMemo } from 'react';
import DealDetailSidebar from './DealDetailSidebar';
import { Sheet } from '../ui/Sheet';
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
        onAddDeal={onAddDeal}
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

      {/* SIDEBAR */}
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
