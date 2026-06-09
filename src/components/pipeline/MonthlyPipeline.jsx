import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DealDetailSidebar from './DealDetailSidebar';
import { Dialog } from '../ui/Dialog';
import { useTeam } from '../../hooks/useTeam';
import PipelineHeader from './PipelineHeader';
import PipelineBoard from './PipelineBoard';
import { useAppStore } from '../../store/useAppStore';
import { parseYearMonth } from '../../lib/utils';
import ConfirmDialog from '../ui/ConfirmDialog';
import WinLossModal from './WinLossModal';

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

  // States for sub-dialogs lifted from DealDetailSidebar
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [winLossState, setWinLossState] = useState({ open: false, targetStage: null, deal: null });

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

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      onDeleteDeal(confirmDeleteId);
      setConfirmDeleteId(null);
      setIsSidebarOpen(false);
    }
  }, [confirmDeleteId, onDeleteDeal]);

  const handleConfirmWinLoss = useCallback((reason, closeDate) => {
    if (winLossState.deal) {
      const isWon = winLossState.targetStage === 'won';
      const closeIsoString = closeDate ? new Date(closeDate + 'T12:00:00').toISOString() : new Date().toISOString();
      onUpdateDeal(winLossState.deal.id, {
        stage: winLossState.targetStage,
        last_activity: new Date().toISOString(),
        actual_close_date: closeIsoString,
        lost_reason: isWon ? null : reason,
        metadata: {
          ...(winLossState.deal?.metadata || {}),
          close_reason: reason,
          ...(isWon ? { win_reason: reason } : {}),
          closed_at: closeIsoString,
        },
      });
      setWinLossState({ open: false, targetStage: null, deal: null });
      setIsSidebarOpen(false);
    }
  }, [winLossState, onUpdateDeal]);

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

      {/* DEAL DETAIL DIALOG */}
      <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen} className="max-w-2xl">
        <DealDetailSidebar
          deal={visibleDeal}
          onUpdate={onUpdateDeal}
          onDelete={handleDelete}
          onClose={() => setIsSidebarOpen(false)}
          onRequestDelete={(dealId) => setConfirmDeleteId(dealId)}
          onRequestCloseStage={(targetStage) => setWinLossState({ open: true, targetStage, deal: visibleDeal })}
        />
      </Dialog>

      {/* CONFIRM DELETE DIALOG (Lifted) */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(v) => !v && setConfirmDeleteId(null)}
        title="ลบดีล"
        description="การดำเนินการนี้จะลบดีลและ Activity ทั้งหมดที่เชื่อมโยงอย่างถาวร"
        confirmLabel="ลบ"
        onConfirm={handleConfirmDelete}
      />

      {/* WIN / LOSS REASON MODAL (Lifted) */}
      <WinLossModal
        open={winLossState.open}
        targetStage={winLossState.targetStage}
        onClose={() => setWinLossState({ open: false, targetStage: null, deal: null })}
        onConfirm={handleConfirmWinLoss}
      />
    </div>
  );
}
