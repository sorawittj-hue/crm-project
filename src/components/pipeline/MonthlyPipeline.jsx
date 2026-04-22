import { useState, useMemo, useCallback, useRef } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Keep the last opened deal in state (not ref) so DealDetailSidebar
  // doesn't receive null while the Sheet's exit animation is running.
  const peekRef = useRef(null);
  const [peekDeal, setPeekDealState] = useState(null);
  const [lastDeal, setLastDeal] = useState(null);
  const setPeekDeal = useCallback((deal) => {
    if (deal) {
      peekRef.current = deal;
      setLastDeal(deal);
    }
    setPeekDealState(deal);
  }, []);
  const visibleDeal = peekDeal || lastDeal;

  const [localMonth, setLocalMonth] = useState(new Date().getMonth());
  const [localYear, setLocalYear] = useState(new Date().getFullYear());

  const selectedMonth = parentSelectedMonth !== undefined ? parentSelectedMonth : localMonth;
  const selectedYear = parentSelectedYear !== undefined ? parentSelectedYear : localYear;

  // Filter deals by month/year — use snake_case only to match Supabase
  const filteredDeals = useMemo(() => {
    const result = deals || [];
    return result.filter(d => {
      const raw = d.created_at || d.createdAt;
      if (!raw) return false;
      const dealDate = new Date(raw);
      return dealDate.getMonth() === selectedMonth && dealDate.getFullYear() === selectedYear;
    });
  }, [deals, selectedMonth, selectedYear]);

  // Stats derived from filtered set
  const monthlyTotal = useMemo(
    () => filteredDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [filteredDeals]
  );
  const monthlyCount = filteredDeals.length;
  const totalDeals = deals?.length || 0;

  // Previous month comparison
  const { lastMonthTotal } = useMemo(() => {
    const lm = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const ly = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const lmDeals = (deals || []).filter(d => {
      const raw = d.created_at || d.createdAt;
      if (!raw) return false;
      const date = new Date(raw);
      return date.getMonth() === lm && date.getFullYear() === ly;
    });
    return { lastMonthTotal: lmDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0) };
  }, [deals, selectedMonth, selectedYear]);

  const handleDealClick = useCallback((deal) => {
    setPeekDeal(deal);
    setIsSidebarOpen(true);
  }, [setPeekDeal]);

  return (
    <div className="flex flex-col space-y-5">
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

      {/* PIPELINE BOARD — flex-based height, no viewport calc */}
      <div className="min-h-[560px]">
        <PipelineBoard
          deals={filteredDeals}
          onDealClick={handleDealClick}
          onUpdateDeal={onUpdateDeal}
          onAddDeal={onAddDeal}
          teamMembers={teamMembers}
        />
      </div>

      {/* SIDEBAR — visibleDeal keeps the content alive during exit animation */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DealDetailSidebar
          deal={visibleDeal}
          onUpdate={onUpdateDeal}
          onDelete={onDeleteDeal}
        />
      </Sheet>
    </div>
  );
}
