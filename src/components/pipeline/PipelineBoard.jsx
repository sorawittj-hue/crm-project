import { useState, useMemo, forwardRef, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Search, Filter, Star, TrendingUp, AlertTriangle,
  Zap, Users,
  ArrowLeft,
  Clock, GripVertical, ChevronRight,
  LayoutGrid, List, ThumbsUp, ThumbsDown,
  Eye, Plus, ChevronDown, Briefcase
} from 'lucide-react';
import { cn, parseYearMonth } from '../../lib/utils';
import { formatFullCurrency as formatCurrency } from '../../lib/formatters';
import { useHorizontalScroll, usePipelineKeyboard } from '../../hooks/useHorizontalScroll';
import { calculateRiskScore } from '../../services/aiDeals';
import { STAGE_IDS } from '../../lib/constants';
import WinLossModal from './WinLossModal';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';

const STAGE_CONFIG = {
  lead: {
    label: 'ลูกค้าใหม่',
    icon: <Search size={14} />,
    dot: 'bg-slate-400',
    accent: 'text-slate-600',
    ring: 'ring-slate-200',
    gradientFrom: 'from-slate-50',
    gradientTo: 'to-slate-100/50',
    headerBg: 'bg-gradient-to-br from-slate-50 to-slate-100/80',
    dotColor: '#94a3b8',
    columnBorder: 'border-slate-200',
  },
  contact: {
    label: 'นัดเจอ',
    icon: <Users size={14} />,
    dot: 'bg-amber-500',
    accent: 'text-amber-700',
    ring: 'ring-amber-200',
    gradientFrom: 'from-amber-50',
    gradientTo: 'to-amber-100/50',
    headerBg: 'bg-gradient-to-br from-amber-50 to-orange-50/80',
    dotColor: '#f59e0b',
    columnBorder: 'border-amber-200',
  },
  proposal: {
    label: 'เสนอราคา',
    icon: <TrendingUp size={14} />,
    dot: 'bg-sky-500',
    accent: 'text-sky-700',
    ring: 'ring-sky-200',
    gradientFrom: 'from-sky-50',
    gradientTo: 'to-blue-100/50',
    headerBg: 'bg-gradient-to-br from-sky-50 to-blue-50/80',
    dotColor: '#0ea5e9',
    columnBorder: 'border-sky-200',
  },
  negotiation: {
    label: 'กำลังปิด',
    icon: <Zap size={14} />,
    dot: 'bg-violet-500',
    accent: 'text-violet-700',
    ring: 'ring-violet-200',
    gradientFrom: 'from-violet-50',
    gradientTo: 'to-purple-100/50',
    headerBg: 'bg-gradient-to-br from-violet-50 to-purple-50/80',
    dotColor: '#8b5cf6',
    columnBorder: 'border-violet-200',
  },
  won: {
    label: 'ปิดได้ ✓',
    icon: <ThumbsUp size={14} />,
    dot: 'bg-emerald-500',
    accent: 'text-emerald-700',
    ring: 'ring-emerald-200',
    gradientFrom: 'from-emerald-50',
    gradientTo: 'to-green-100/50',
    headerBg: 'bg-gradient-to-br from-emerald-50 to-green-50/80',
    dotColor: '#10b981',
    columnBorder: 'border-emerald-200',
  },
  lost: {
    label: 'ปิดไม่ได้',
    icon: <ThumbsDown size={14} />,
    dot: 'bg-rose-500',
    accent: 'text-rose-600',
    ring: 'ring-rose-200',
    gradientFrom: 'from-rose-50',
    gradientTo: 'to-red-100/50',
    headerBg: 'bg-gradient-to-br from-rose-50 to-red-50/80',
    dotColor: '#f43f5e',
    columnBorder: 'border-rose-200',
  },
};

const STAGES = STAGE_IDS;

const QUICK_FILTERS = [
  { id: 'all', label: 'ทั้งหมด', icon: Filter, color: 'violet' },
  { id: 'my-deals', label: 'ของฉัน', icon: Star, color: 'amber' },
  { id: 'high-value', label: 'มูลค่าสูง', icon: TrendingUp, color: 'emerald' },
  { id: 'at-risk', label: 'หยุดนิ่ง', icon: AlertTriangle, color: 'rose' },
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

  const filterColorMap = {
    violet: { active: 'bg-violet-600 text-white border-violet-600 shadow-violet-200', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600' },
    amber: { active: 'bg-amber-500 text-white border-amber-500 shadow-amber-200', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600' },
    emerald: { active: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600' },
    rose: { active: 'bg-rose-500 text-white border-rose-500 shadow-rose-200', inactive: 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600' },
  };

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-sm mx-4 my-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/50 to-violet-50/50" />
        <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3 hover:rotate-6 transition-transform duration-500">
            <Briefcase size={40} className="text-violet-600 drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-3">ยินดีต้อนรับสู่ Nova Pipeline</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
            พื้นที่ทำงานหลักสำหรับบริหารจัดการการขายของคุณ เริ่มต้นสร้างดีลแรกของคุณเพื่อติดตามความคืบหน้าและปิดการขายอย่างมืออาชีพ
          </p>
          <Button 
            size="lg" 
            onClick={() => useAppStore.getState().setIsQuickAddOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 px-8 py-6 rounded-2xl text-base font-bold transition-all hover:scale-105"
          >
            <Plus className="mr-2" size={20} />
            สร้างดีลแรกของคุณ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* QUICK FILTER BAR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {QUICK_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            const colors = filterColorMap[filter.color];
            const count = filter.id === 'all'
              ? processedDeals.length
              : filter.id === 'my-deals'
              ? processedDeals.filter(d => d.assigned_to === user?.id || d.assigned_to === 'leader').length
              : filter.id === 'high-value'
              ? processedDeals.filter(d => Number(d.value) >= 1000000).length
              : processedDeals.filter(d => d.agingDays > 7 && !['won', 'lost'].includes(d.stage)).length;

            return (
              <motion.button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border shadow-sm',
                  isActive ? `${colors.active} shadow-md` : colors.inactive
                )}
              >
                <filter.icon size={13} strokeWidth={2.5} />
                <span>{filter.label}</span>
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'kanban' && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 hidden md:flex">
              <GripVertical size={12} />
              ลากเพื่อย้ายขั้นตอน
            </p>
          )}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn('p-1.5 rounded-lg transition-all', viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700')}
              title="Kanban"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700')}
              title="รายการ"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* LIST VIEW (Desktop Only) */}
      {viewMode === 'list' && (
        <div className="hidden md:block overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {processedDeals.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Filter size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm font-medium">ไม่พบดีลที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">บริษัท / ดีล</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ขั้นตอน</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">มูลค่า</th>
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">โอกาส</th>
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ไม่มีกิจกรรม</th>
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {processedDeals.map((deal, idx) => {
                  const stage = STAGE_CONFIG[deal.stage];
                  const isStagnant = deal.agingDays > 7 && !['won', 'lost'].includes(deal.stage);
                  return (
                    <motion.tr
                      key={deal.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => onDealClick(deal)}
                      className={cn('hover:bg-violet-50/50 cursor-pointer transition-colors group', isStagnant && 'bg-rose-50/30')}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${stage.dotColor}cc, ${stage.dotColor})` }}>
                            {(deal.company || 'D').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate max-w-[180px]">{deal.company || '—'}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{deal.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold', stage.accent)}
                          style={{ backgroundColor: `${stage.dotColor}15`, border: `1px solid ${stage.dotColor}30` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.dotColor }} />
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-900 tabular-nums text-sm">{formatCurrency(deal.value)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn('text-xs font-bold tabular-nums',
                            deal.probability >= 70 ? 'text-emerald-600' : deal.probability >= 40 ? 'text-slate-700' : 'text-slate-400'
                          )}>{deal.probability ?? '—'}%</span>
                          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${deal.probability || 0}%`,
                                backgroundColor: deal.probability >= 70 ? '#10b981' : deal.probability >= 40 ? '#8b5cf6' : '#cbd5e1'
                              }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg tabular-nums',
                          isStagnant ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                        )}>
                          {isStagnant && <Clock size={10} />}
                          {deal.agingDays}ว
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={STAGES.indexOf(deal.stage) === 0}
                            onClick={() => handleMoveDeal(deal.id, 'left')}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          >
                            <ArrowLeft size={13} />
                          </button>
                          <button
                            onClick={() => onDealClick(deal)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-400 hover:bg-violet-50 hover:text-violet-600 transition-all"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            disabled={STAGES.indexOf(deal.stage) === STAGES.length - 1}
                            onClick={() => handleMoveDeal(deal.id, 'right')}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* KANBAN BOARD (Desktop Only) */}
      {viewMode === 'kanban' && (
        <div className="hidden md:block">
          <DragDropContext onDragEnd={handleDragEnd}>
          <div
            ref={scrollRef}
            className="flex-1 min-h-[560px] relative overflow-x-auto overflow-y-hidden custom-scrollbar-horizontal"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-3.5 h-full pb-4" style={{ minWidth: 'max-content' }}>
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
                          'flex-shrink-0 flex flex-col w-[290px] h-full rounded-2xl transition-all duration-300 border overflow-hidden',
                          snapshot.isDraggingOver
                            ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-400/30 shadow-lg shadow-violet-100'
                            : 'bg-white/70 backdrop-blur-sm border-slate-200/80 shadow-sm hover:shadow-md'
                        )}
                      >
                        {/* Column header */}
                        <div className={cn('px-4 pt-4 pb-3.5 border-b border-slate-100', stage.headerBg)}>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                                style={{ backgroundColor: stage.dotColor }}>
                                <span className="text-[10px]">{stage.icon}</span>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800">{stage.label}</h3>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                              style={{ backgroundColor: stage.dotColor }}>
                              {stageDeals.length}
                            </span>
                          </div>
                          <p className="text-sm font-black tabular-nums" style={{ color: stage.dotColor }}>
                            {formatCurrency(totalValue)}
                          </p>
                        </div>

                        {/* Cards */}
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 custom-scrollbar-thin">
                          <InnerList 
                            deals={stageDeals} 
                            stageColor={stage.dotColor}
                            selectedDealId={selectedDealId}
                            pinnedDealIds={pinnedDealIds}
                            STAGES={STAGES}
                            setSelectedDealId={setSelectedDealId}
                            onDealClick={onDealClick}
                            togglePin={togglePin}
                            handleMoveDeal={handleMoveDeal}
                          />
                          {provided.placeholder}
                          {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-32 border-2 border-dashed border-slate-200/60 rounded-xl flex flex-col items-center justify-center text-slate-300 gap-2 bg-slate-50/30">
                              <div className="w-8 h-8 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                                <Plus size={14} className="text-slate-300" />
                              </div>
                              <p className="text-xs font-medium">ลากดีลมาที่นี่</p>
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
        </div>
      )}

      {/* MOBILE LIST VIEW (Always visible on mobile, ignores viewMode) */}
      <div className="block md:hidden space-y-4">
        {STAGES.map((stageId) => {
          const stage = STAGE_CONFIG[stageId];
          const stageDeals = dealsByStage[stageId] || [];
          if (stageDeals.length === 0) return null;

          return (
            <div key={stageId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className={cn('px-4 py-3 border-b border-slate-100 flex items-center justify-between', stage.headerBg)}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: stage.dotColor }}>
                    <span className="text-[10px]">{stage.icon}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{stage.label}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 text-slate-700 shadow-sm border border-white/20">
                  {stageDeals.length} ดีล
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {stageDeals.map((deal) => (
                  <div key={deal.id} onClick={() => onDealClick(deal)} className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: stage.dotColor }} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{deal.company || '—'}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{deal.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(deal.value)}</p>
                        {deal.probability !== undefined && deal.probability !== null && (
                          <p className={cn("text-xs font-bold mt-1 tabular-nums", deal.probability >= 70 ? "text-emerald-600" : deal.probability >= 40 ? "text-violet-600" : "text-slate-400")}>
                            {deal.probability}% โอกาส
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {processedDeals.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Filter size={20} className="text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-medium">ไม่พบดีลที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>

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

const InnerList = memo(({ deals, stageColor, selectedDealId, pinnedDealIds, STAGES, setSelectedDealId, onDealClick, togglePin, handleMoveDeal }) => {
  return (
    <>
      {deals.map((deal, index) => (
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
              stageColor={stageColor}
            />
          )}
        </Draggable>
      ))}
    </>
  );
});
InnerList.displayName = 'InnerList';

const DealCard = memo(
  forwardRef(
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
        stageColor,
      },
      ref
    ) => {
      const isStagnant = deal.agingDays > 7 && !['won', 'lost'].includes(deal.stage);
      const isHighValue = Number(deal.value) >= 1000000;

      // Generate a consistent color from the company name
      const getAvatarColor = (name) => {
        const colors = [
          '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
          '#ef4444', '#ec4899', '#3b82f6', '#14b8a6', '#f97316',
        ];
        const hash = (name || 'D').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return colors[hash % colors.length];
      };

      const avatarColor = getAvatarColor(deal.company);

      return (
        <div
          ref={ref}
          {...draggableProps}
          {...dragHandleProps}
        >
          <motion.div
            initial={false}
            animate={isDragging ? { scale: 1.04, rotate: 1.5, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.25)' } : { scale: 1, rotate: 0, boxShadow: 'none' }}
            whileHover={{ y: -2, borderColor: 'rgba(124, 58, 237, 0.4)', boxShadow: '0 10px 20px rgba(0, 0, 0, 0.04)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              'group relative rounded-2xl border cursor-grab active:cursor-grabbing overflow-hidden',
              isDragging ? 'border-violet-400 ring-2 ring-violet-500/30 z-50 bg-white' 
                : isSelected ? 'border-violet-400 ring-2 ring-violet-500/15 bg-white shadow-md'
                : isPinned ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                : isStagnant ? 'border-rose-200 bg-rose-50/30 shadow-sm'
                : 'border-slate-200/80 bg-white shadow-sm'
            )}
          >
            {/* Colored top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: stageColor }} />

            {/* Main content (clickable) */}
            <div
              className="p-3.5 space-y-3"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                onClick(deal);
              }}
            >
              {/* Top row: company + indicators */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {(deal.company || 'D').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {deal.company || 'ไม่ระบุบริษัท'}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {deal.title || 'ไม่มีชื่อดีล'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isPinned && <Star size={11} className="text-amber-500 fill-current" />}
                  {isStagnant && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md"
                      title="ไม่มีความเคลื่อนไหวเกิน 7 วัน"
                    >
                      <Clock size={9} />
                      {deal.agingDays}ว
                    </span>
                  )}
                </div>
              </div>

              {/* Value + probability */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-slate-900 tabular-nums leading-none tracking-tight">
                  {formatCurrency(deal.value)}
                </span>
                {deal.probability !== undefined && deal.probability !== null && (
                  <span
                    className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: deal.probability >= 70 ? '#dcfce7' : deal.probability >= 40 ? '#ede9fe' : '#f1f5f9',
                      color: deal.probability >= 70 ? '#16a34a' : deal.probability >= 40 ? '#7c3aed' : '#94a3b8',
                    }}
                  >
                    {deal.probability}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, deal.probability || 0))}%` }}
                  transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: deal.probability >= 70
                      ? 'linear-gradient(to right, #34d399, #10b981)'
                      : deal.probability >= 40
                      ? 'linear-gradient(to right, #a78bfa, #8b5cf6)'
                      : '#cbd5e1',
                  }}
                />
              </div>
            </div>

            {/* Action row — smooth hover reveal */}
            <div className="grid grid-cols-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200 max-h-0 group-hover:max-h-12 overflow-hidden bg-slate-50/80">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('left');
                }}
                disabled={!canMoveLeft}
                className={cn(
                  'h-10 flex items-center justify-center text-slate-400 text-xs gap-1 transition-all font-medium',
                  canMoveLeft
                    ? 'hover:bg-slate-100 hover:text-slate-700'
                    : 'opacity-20 cursor-not-allowed'
                )}
                title="ย้อนขั้นตอน"
              >
                <ArrowLeft size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin();
                }}
                className={cn(
                  'h-10 flex items-center justify-center text-xs gap-1 transition-all border-x border-slate-100',
                  isPinned
                    ? 'text-amber-500 hover:bg-amber-50'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500'
                )}
                title={isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
              >
                <Star size={13} fill={isPinned ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('right');
                }}
                disabled={!canMoveRight}
                className={cn(
                  'h-10 flex items-center justify-center text-slate-400 text-xs gap-1 transition-all font-medium',
                  canMoveRight
                    ? 'hover:bg-violet-50 hover:text-violet-600'
                    : 'opacity-20 cursor-not-allowed'
                )}
                title="ไปขั้นตอนถัดไป"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      );
    }
  ),
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.isPinned === next.isPinned &&
      prev.isDragging === next.isDragging &&
      prev.canMoveLeft === next.canMoveLeft &&
      prev.canMoveRight === next.canMoveRight &&
      prev.stageColor === next.stageColor &&
      prev.deal.id === next.deal.id &&
      prev.deal.value === next.deal.value &&
      prev.deal.stage === next.deal.stage &&
      prev.deal.title === next.deal.title &&
      prev.deal.company === next.deal.company &&
      prev.deal.probability === next.deal.probability &&
      prev.deal.agingDays === next.deal.agingDays
    );
  }
);

DealCard.displayName = 'DealCard';
