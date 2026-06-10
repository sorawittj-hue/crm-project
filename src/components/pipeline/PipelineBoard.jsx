import { useState, useMemo, forwardRef, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Search, Filter, Star, TrendingUp, AlertTriangle,
  Zap, Users,
  ArrowLeft,
  Clock, GripVertical, ChevronRight,
  LayoutGrid, List, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { cn, parseYearMonth } from '../../lib/utils';
import { formatFullCurrency as formatCurrency } from '../../lib/formatters';
import { useHorizontalScroll, usePipelineKeyboard } from '../../hooks/useHorizontalScroll';
import { calculateRiskScore } from '../../services/aiDeals';
import { STAGE_IDS } from '../../lib/constants';
import WinLossModal from './WinLossModal';
import { useAuth } from '../../hooks/useAuth';

const STAGE_CONFIG = {
  lead: {
    label: 'ลูกค้าใหม่',
    icon: <Search size={14} />,
    dot: 'bg-slate-400',
    accent: 'text-slate-700',
    ring: 'ring-slate-200',
  },
  contact: {
    label: 'นัดเจอ',
    icon: <Users size={14} />,
    dot: 'bg-amber-500',
    accent: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  proposal: {
    label: 'เสนอราคา',
    icon: <TrendingUp size={14} />,
    dot: 'bg-sky-500',
    accent: 'text-sky-700',
    ring: 'ring-sky-200',
  },
  negotiation: {
    label: 'กำลังปิด',
    icon: <Zap size={14} />,
    dot: 'bg-violet-500',
    accent: 'text-violet-700',
    ring: 'ring-violet-200',
  },
  won: {
    label: 'ปิดได้',
    icon: <ThumbsUp size={14} />,
    dot: 'bg-emerald-500',
    accent: 'text-emerald-700',
    ring: 'ring-emerald-200',
  },
  lost: {
    label: 'ปิดไม่ได้',
    icon: <ThumbsDown size={14} />,
    dot: 'bg-rose-500',
    accent: 'text-rose-700',
    ring: 'ring-rose-200',
  },
};

const STAGES = STAGE_IDS;

const QUICK_FILTERS = [
  { id: 'all', label: 'ทั้งหมด', icon: Filter },
  { id: 'my-deals', label: 'ของฉัน', icon: Star },
  { id: 'high-value', label: 'มูลค่าสูง', icon: TrendingUp },
  { id: 'at-risk', label: 'หยุดนิ่ง', icon: AlertTriangle },
];

export default function PipelineBoard({
  deals = [],
  onDealClick,
  onUpdateDeal,
  selectedMonth,
  selectedYear,
}) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [pinnedDealIds, setPinnedDealIds] = useState([]);

  // Win/Loss Reason State
  const [reasonModal, setReasonModal] = useState({ open: false, dealId: null, targetStage: null });
  const [localDeals, setLocalDeals] = useState([]);

  // Sync localDeals with parent deals
  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const scrollRef = useHorizontalScroll();
  const [viewMode, setViewMode] = useState('kanban');

  // eslint-disable-next-line react-hooks/purity
  const nowMsRef = useRef(Date.now());

  const processedDeals = useMemo(() => {
    // Refresh timestamp each time deals change, captured outside render path
    // eslint-disable-next-line react-hooks/purity
    nowMsRef.current = Date.now();
    const nowMs = nowMsRef.current;

    const targetMonth = selectedMonth !== undefined ? selectedMonth : new Date().getMonth();
    const targetYear = selectedYear !== undefined ? selectedYear : new Date().getFullYear();
    const today = new Date(nowMs);
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();

    let result = localDeals.map((deal) => {
      const createdRaw = deal.createdAt || deal.created_at;
      const createdMs = createdRaw ? new Date(createdRaw).getTime() : nowMs;
      const agingDays = Math.floor((nowMs - createdMs) / 86_400_000);
      return {
        ...deal,
        risk: calculateRiskScore(deal, [], nowMs),
        agingDays,
      };
    });

    result = result.filter((deal) => {
      const isClosed = ['won', 'lost'].includes(deal.stage);
      
      if (isClosed) {
        const parsedClose = parseYearMonth(deal.actual_close_date || deal.updated_at || deal.created_at);
        if (!parsedClose) return false;
        return parsedClose.month === targetMonth && parsedClose.year === targetYear;
      } else {
        const parsedExpected = parseYearMonth(deal.expected_close_date || deal.created_at);
        if (!parsedExpected) return true;
        return parsedExpected.month === targetMonth && parsedExpected.year === targetYear;
      }
    });

    switch (activeFilter) {
      case 'my-deals':
        result = result.filter((deal) => deal.assigned_to === user?.id || deal.assigned_to === 'leader');
        break;
      case 'high-value':
        result = result.filter((deal) => Number(deal.value) >= 1000000);
        break;
      case 'at-risk':
        result = result.filter(
          (deal) => deal.agingDays > 7 && !['won', 'lost'].includes(deal.stage)
        );
        break;
      default:
        break;
    }
    return result;
  }, [localDeals, activeFilter, selectedMonth, selectedYear, user?.id]);

  const dealsByStage = useMemo(() => {
    return STAGES.reduce((acc, stageId) => {
      acc[stageId] = processedDeals.filter((d) => d.stage === stageId);
      return acc;
    }, {});
  }, [processedDeals]);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (destination.droppableId === source.droppableId) {
      const stageDeals = Array.from(dealsByStage[source.droppableId] || []);
      const [removed] = stageDeals.splice(source.index, 1);
      stageDeals.splice(destination.index, 0, removed);

      setLocalDeals((prev) => {
        const cloned = [...prev];
        const fromIndex = cloned.findIndex(d => d.id === removed.id);
        if (fromIndex !== -1) cloned.splice(fromIndex, 1);
        
        if (destination.index === 0) {
            const firstItem = stageDeals.find(d => d.id !== removed.id);
            if (firstItem) {
                const targetIdx = cloned.findIndex(d => d.id === firstItem.id);
                cloned.splice(targetIdx, 0, removed);
            } else {
                cloned.push(removed);
            }
        } else {
            const prevItem = stageDeals[destination.index - 1];
            const targetIdx = cloned.findIndex(d => d.id === prevItem.id);
            cloned.splice(targetIdx + 1, 0, removed);
        }
        return cloned;
      });
      return;
    }

    const targetStage = destination.droppableId;
    initiateMove(draggableId, targetStage);
  };

  const handleMoveDeal = (dealId, direction) => {
    const deal = localDeals.find((d) => d.id === dealId);
    if (!deal) return;

    const currentIndex = STAGES.indexOf(deal.stage);
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < STAGES.length) {
      const targetStage = STAGES[newIndex];
      initiateMove(dealId, targetStage);
    }
  };

  const initiateMove = (dealId, targetStage) => {
    setLocalDeals(prev => prev.map(d => 
      d.id === dealId ? { ...d, stage: targetStage, last_activity: new Date().toISOString() } : d
    ));

    if (targetStage === 'won' || targetStage === 'lost') {
      setReasonModal({ open: true, dealId, targetStage });
    } else {
      onUpdateDeal(dealId, {
        stage: targetStage,
        last_activity: new Date().toISOString(),
      });
    }
  };

  const submitReason = (reason, closeDate) => {
    const isWon = reasonModal.targetStage === 'won';
    const deal = deals.find(d => d.id === reasonModal.dealId); // use original deals for metadata
    const closeIsoString = closeDate ? new Date(closeDate + 'T12:00:00').toISOString() : new Date().toISOString();
    const updates = {
      stage: reasonModal.targetStage,
      last_activity: new Date().toISOString(),
      actual_close_date: closeIsoString,
      lost_reason: isWon ? null : reason,
      metadata: {
        ...(deal?.metadata || {}),
        ...(isWon ? { win_reason: reason } : {}),
        close_reason: reason,
        closed_at: closeIsoString,
      },
    };
    onUpdateDeal(reasonModal.dealId, updates);
    setReasonModal({ open: false, dealId: null, targetStage: null });
  };

  const closeReasonModal = () => {
    // Revert optimistic update
    setLocalDeals(deals);
    setReasonModal({ open: false, dealId: null, targetStage: null });
  };

  usePipelineKeyboard({
    onMoveLeft: () => selectedDealId && handleMoveDeal(selectedDealId, 'left'),
    onMoveRight: () => selectedDealId && handleMoveDeal(selectedDealId, 'right'),
    onEscape: () => setSelectedDealId(null),
  });

  const togglePin = (dealId) => {
    setPinnedDealIds((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  };

  return (
    <div className="h-full flex flex-col space-y-5">
      {/* QUICK FILTER BAR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {QUICK_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border',
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                )}
              >
                <filter.icon size={13} strokeWidth={2.5} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'kanban' && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 hidden md:flex">
              <GripVertical size={12} />
              เลื่อนซ้าย-ขวาเพื่อดูทุกขั้นตอน
            </p>
          )}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn('p-1.5 rounded-lg transition-all', viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700')}
              title="Kanban"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700')}
              title="รายการ"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white">
          {processedDeals.length === 0 ? (
            <div className="py-20 text-center text-slate-300 text-sm">ไม่พบดีล</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">บริษัท / ดีล</th>
                  <th className="text-left px-4 py-3">ขั้นตอน</th>
                  <th className="text-right px-4 py-3">มูลค่า</th>
                  <th className="text-center px-4 py-3">โอกาส</th>
                  <th className="text-center px-4 py-3">ไม่มีกิจกรรม</th>
                  <th className="text-center px-4 py-3">ย้าย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {processedDeals.map((deal) => {
                  const stage = STAGE_CONFIG[deal.stage];
                  const isStagnant = deal.agingDays > 7 && !['won', 'lost'].includes(deal.stage);
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => onDealClick(deal)}
                      className={cn('hover:bg-slate-50 cursor-pointer transition-colors group', isStagnant && 'bg-rose-50/30')}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate max-w-[200px]">{deal.company || '—'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{deal.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', `${stage.dot.replace('bg-', 'bg-')}/10`, stage.accent)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', stage.dot)} />
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(deal.value)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs font-bold tabular-nums',
                          deal.probability >= 70 ? 'text-emerald-600' : deal.probability >= 40 ? 'text-slate-700' : 'text-slate-400'
                        )}>{deal.probability ?? '—'}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs font-semibold tabular-nums', isStagnant ? 'text-rose-500' : 'text-slate-400')}>
                          {deal.agingDays}ว
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={STAGES.indexOf(deal.stage) === 0}
                            onClick={() => handleMoveDeal(deal.id, 'left')}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          >
                            <ArrowLeft size={13} />
                          </button>
                          <button
                            disabled={STAGES.indexOf(deal.stage) === STAGES.length - 1}
                            onClick={() => handleMoveDeal(deal.id, 'right')}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            ref={scrollRef}
            className="flex-1 min-h-[560px] relative overflow-x-auto overflow-y-hidden custom-scrollbar-horizontal"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-4 h-full pb-3" style={{ minWidth: 'max-content' }}>
              {STAGES.map((stageId) => {
                const stage = STAGE_CONFIG[stageId];
                const stageDeals = dealsByStage[stageId] || [];
                const totalValue = stageDeals.reduce(
                  (sum, d) => sum + (Number(d.value) || 0),
                  0
                );

                return (
                  <Droppable droppableId={stageId} key={stageId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          'flex-shrink-0 flex flex-col w-[260px] h-full rounded-2xl transition-all duration-300 border backdrop-blur-sm',
                          snapshot.isDraggingOver
                            ? 'bg-violet-50/80 border-violet-300 ring-4 ring-violet-500/20 shadow-inner'
                            : 'bg-white/40 border-slate-200/60 shadow-sm hover:bg-white/60'
                        )}
                      >
                        {/* Column header */}
                        <div className="px-4 pt-4 pb-3 border-b border-slate-200/40">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={cn('w-2 h-2 rounded-full', stage.dot)} />
                              <h3 className="text-sm font-bold text-slate-800">{stage.label}</h3>
                              <span className="text-xs text-slate-400 font-medium bg-slate-100/50 px-2 py-0.5 rounded-full">
                                {stageDeals.length}
                              </span>
                            </div>
                            <span className={cn('text-[10px]', stage.accent)}>{stage.icon}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 tabular-nums">
                            {formatCurrency(totalValue)}
                          </p>
                        </div>

                        {/* Cards */}
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar-thin">
                          {stageDeals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <DealCard
                                  ref={dragProvided.innerRef}
                                  draggableProps={dragProvided.draggableProps}
                                  dragHandleProps={dragProvided.dragHandleProps}
                                  isDragging={dragSnapshot.isDragging}
                                  deal={deal}
                                  isSelected={selectedDealId === deal.id}
                                  isPinned={pinnedDealIds.includes(deal.id)}
                                  canMoveLeft={STAGES.indexOf(deal.stage) > 0}
                                  canMoveRight={STAGES.indexOf(deal.stage) < STAGES.length - 1}
                                  onSelect={() => setSelectedDealId(deal.id)}
                                  onClick={() => onDealClick(deal)}
                                  onPin={() => togglePin(deal.id)}
                                  onMove={(dir) => handleMoveDeal(deal.id, dir)}
                                />
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-28 border-2 border-dashed border-slate-200/60 rounded-xl flex flex-col items-center justify-center text-slate-400/60 bg-white/20">
                              <p className="text-xs font-medium">ยังไม่มีดีล</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* WIN/LOSS REASON MODAL — shared component */}
      <WinLossModal
        open={reasonModal.open}
        targetStage={reasonModal.targetStage}
        onClose={closeReasonModal}
        onConfirm={submitReason}
      />
    </div>
  );
}

const DealCard = forwardRef(
  (
    {
      deal,
      isSelected,
      isPinned,
      isDragging,
      canMoveLeft,
      canMoveRight,
      onSelect,
      onClick,
      onPin,
      onMove,
      draggableProps,
      dragHandleProps,
    },
    ref
  ) => {
    const isStagnant = deal.agingDays > 7 && !['won', 'lost'].includes(deal.stage);

    return (
      <div
        ref={ref}
        {...draggableProps}
        {...dragHandleProps}
      >
        <motion.div
          initial={false}
          animate={isDragging ? { scale: 1.05, rotate: 2 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'group relative bg-white/80 backdrop-blur-md rounded-xl border transition-colors duration-200 cursor-grab active:cursor-grabbing',
            isDragging ? 'shadow-xl border-violet-400 ring-2 ring-violet-500/30 z-50' : 'shadow-sm hover:shadow-md hover:border-violet-200',
            isSelected ? 'border-violet-400 ring-2 ring-violet-500/15' : 'border-slate-200/80',
            isPinned && 'border-amber-300 bg-amber-50/40',
            isStagnant && !isSelected && 'border-rose-200 bg-rose-50/20'
          )}
        >
        {/* Main content (clickable) */}
        <div
          className="p-3.5 space-y-3"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            onClick(deal);
          }}
        >
          {/* Top row: company + pin indicator */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                {deal.company || 'ไม่ระบุบริษัท'}
              </p>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                {deal.title || 'ไม่มีชื่อดีล'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isPinned && <Star size={12} className="text-amber-500 fill-current" />}
              {isStagnant && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md border border-rose-200/50 shadow-sm"
                  title="ไม่มีความเคลื่อนไหวเกิน 7 วัน"
                >
                  <Clock size={9} />
                  {deal.agingDays}ว
                </span>
              )}
            </div>
          </div>

          {/* Value */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-black text-slate-900 tabular-nums leading-none tracking-tight">
              {formatCurrency(deal.value)}
            </span>
            {deal.probability !== undefined && deal.probability !== null && (
              <span
                className={cn(
                  'text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-slate-50',
                  deal.probability >= 70
                    ? 'text-emerald-600 bg-emerald-50'
                    : deal.probability >= 40
                    ? 'text-slate-700'
                    : 'text-slate-500 bg-slate-100'
                )}
              >
                {deal.probability}%
              </span>
            )}
          </div>

          {/* Progress bar + assignee */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-sm',
                deal.assigned_to === 'leader' ? 'bg-indigo-600' : 'bg-slate-500'
              )}
              title={deal.assigned_to || 'ยังไม่มอบหมาย'}
            >
              {(deal.assigned_to || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 h-1.5 bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  deal.probability >= 70
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : deal.probability >= 40
                    ? 'bg-gradient-to-r from-violet-400 to-violet-500'
                    : 'bg-slate-300'
                )}
                style={{ width: `${Math.max(0, Math.min(100, deal.probability || 0))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action row — visible on hover only to keep cards compact */}
        <div className="flex items-center border-t border-slate-100/80 overflow-hidden max-h-0 group-hover:max-h-10 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 bg-slate-50/50 rounded-b-xl backdrop-blur-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove('left');
            }}
            disabled={!canMoveLeft}
            className={cn(
              'flex-1 h-9 flex items-center justify-center text-slate-400 transition-all',
              canMoveLeft
                ? 'hover:bg-slate-200/50 hover:text-slate-900'
                : 'opacity-30 cursor-not-allowed'
            )}
            title="ย้อนขั้นตอน"
            aria-label="ย้อนขั้นตอน"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="w-px h-4 bg-slate-200/60" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className={cn(
              'flex-1 h-9 flex items-center justify-center transition-all',
              isPinned
                ? 'text-amber-500 hover:bg-amber-100/50'
                : 'text-slate-400 hover:bg-slate-200/50 hover:text-amber-500'
            )}
            title={isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
            aria-label="ปักหมุด"
          >
            <Star size={14} fill={isPinned ? 'currentColor' : 'none'} />
          </button>
          <div className="w-px h-4 bg-slate-200/60" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove('right');
            }}
            disabled={!canMoveRight}
            className={cn(
              'flex-1 h-9 flex items-center justify-center text-slate-400 transition-all',
              canMoveRight
                ? 'hover:bg-violet-100/50 hover:text-violet-600'
                : 'opacity-30 cursor-not-allowed'
            )}
            title="ไปขั้นตอนถัดไป"
            aria-label="ไปขั้นตอนถัดไป"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        </motion.div>
      </div>
    );
  }
);

DealCard.displayName = 'DealCard';

