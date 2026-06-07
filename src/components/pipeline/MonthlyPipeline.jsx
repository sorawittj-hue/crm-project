import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DealDetailSidebar from './DealDetailSidebar';
import { Sheet } from '../ui/Sheet';
import { useTeam } from '../../hooks/useTeam';
import PipelineHeader from './PipelineHeader';
import PipelineBoard from './PipelineBoard';
import { useAppStore } from '../../store/useAppStore';
import { parseYearMonth } from '../../lib/utils';

export default function MonthlyPipeline({
  deals,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  selectedMonth: parentSelectedMonth,
  selectedYear: parentSelectedYear,
  onMonthChange,
  onYearChange,
  // Global deal selection from notification clicks or dashboard
  pendingOpenDeal,
  onPendingOpenDealHandled,
}) {
  const { data: teamMembers } = useTeam();
  const { monthlyTarget } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Open a specific deal when triggered from notification or dashboard
  useEffect(() => {
    if (pendingOpenDeal) {
      setPeekDeal(pendingOpenDeal);
      setIsSidebarOpen(true);
      onPendingOpenDealHandled?.();
    }
  }, [pendingOpenDeal, setPeekDeal, onPendingOpenDealHandled]);

  // ── KPI stats ──────────────────────────────────────────────────────────────
  // Use actual_close_date for won deals to measure monthly revenue correctly.
  // Active deal count is total in-flight deals (regardless of creation month).
  const { monthlyTotal, monthlyCount, lastMonthTotal } = useMemo(() => {
    const allDeals = deals || [];

    const isInMonth = (raw, m, y) => {
      const parsed = parseYearMonth(raw);
      return parsed ? parsed.month === m && parsed.year === y : false;
    };

    const lm = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const ly = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const wonThisMonth = allDeals.filter(d =>
      d.stage === 'won' &&
      isInMonth(d.actual_close_date || d.updated_at || d.created_at, selectedMonth, selectedYear)
    );
    const wonPrevMonth = allDeals.filter(d =>
      d.stage === 'won' &&
      isInMonth(d.actual_close_date || d.updated_at || d.created_at, lm, ly)
    );

    return {
      monthlyTotal: wonThisMonth.reduce((s, d) => s + (Number(d.value) || 0), 0),
      monthlyCount: wonThisMonth.length,
      lastMonthTotal: wonPrevMonth.reduce((s, d) => s + (Number(d.value) || 0), 0),
    };
  }, [deals, selectedMonth, selectedYear]);

  const totalDeals = deals?.length || 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDealClick = useCallback((deal) => {
    setPeekDeal(deal);
    setIsSidebarOpen(true);
  }, [setPeekDeal]);

  // Close sidebar automatically after a deal is deleted
  const handleDelete = useCallback((dealId) => {
    onDeleteDeal(dealId);
    setIsSidebarOpen(false);
  }, [onDeleteDeal]);

  return (
    <div className="flex flex-col space-y-5">
      {/* HEADER WITH KPIs — stats filtered by selected month (won revenue) */}
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

      {/* PIPELINE BOARD — shows filtered deals with carry-over logic */}
      <div className="min-h-[560px]">
        <PipelineBoard
          deals={deals || []}
          onDealClick={handleDealClick}
          onUpdateDeal={onUpdateDeal}
          onAddDeal={onAddDeal}
          teamMembers={teamMembers}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>

      {/* DEAL DETAIL SIDEBAR */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DealDetailSidebar
          deal={visibleDeal}
          onUpdate={onUpdateDeal}
          onDelete={handleDelete}
          onClose={() => setIsSidebarOpen(false)}
        />
      </Sheet>
    </div>
  );
}
