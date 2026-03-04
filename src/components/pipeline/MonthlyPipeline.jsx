import { useState, useMemo, useEffect } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Target, DollarSign, Users, Flame, Zap, Filter, Plus, Download,
  MoreHorizontal, ArrowUpRight, ArrowDownRight, Activity, Award,
  BarChart3, PieChart, Clock, CheckCircle2, AlertCircle, Sparkles,
  Search, RefreshCw, LayoutGrid, List, CalendarDays
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import PipelineFilters from './PipelineFilters';
import MonthlyComparison from './MonthlyComparison';
import DealAgingReport from './DealAgingReport';

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '฿0';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const getMonthName = (year, month) => {
  return new Date(year, month).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
};

// ==================== STAGES CONFIGURATION ====================
const STAGES = [
  { id: 'lead', title: 'ลูกค้าใหม่', titleEn: 'Lead', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', icon: Users },
  { id: 'contact', title: 'ติดต่อแล้ว', titleEn: 'Contact', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-700', icon: Activity },
  { id: 'proposal', title: 'เสนอราคา', titleEn: 'Proposal', color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', icon: FileText },
  { id: 'negotiation', title: 'เจรจา', titleEn: 'Negotiation', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700', icon: Flame },
  { id: 'won', title: 'ปิดการขาย', titleEn: 'Won', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-700', icon: CheckCircle2 },
  { id: 'lost', title: 'หลุด/แพ้', titleEn: 'Lost', color: 'from-rose-500 to-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-700', icon: AlertCircle },
];

import { FileText } from 'lucide-react';

// ==================== COMPONENT: MONTH SELECTOR ====================
const MonthSelector = ({ currentDate, onChange, monthlyStats }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const months = useMemo(() => {
    const m = [];
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      m.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: getMonthName(d.getFullYear(), d.getMonth()),
        key: `${d.getFullYear()}-${d.getMonth()}`
      });
    }
    return m;
  }, []);

  const currentKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const stats = monthlyStats[currentKey] || { total: 0, won: 0 };

  const handlePrevMonth = () => {
    onChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrevMonth}
        className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/25 font-bold text-base min-w-[160px] flex items-center justify-center gap-2 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Calendar size={16} />
          {getMonthName(currentDate.getFullYear(), currentDate.getMonth())}
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            {months.map((m) => (
              <button
                key={m.key}
                onClick={() => {
                  onChange(new Date(m.year, m.month, 1));
                  setShowDropdown(false);
                }}
                className={`w-full px-3 py-2.5 text-left font-medium text-sm transition-colors flex items-center justify-between ${m.key === currentKey
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'hover:bg-gray-50 text-gray-700'
                  }`}
              >
                <span>{m.label}</span>
                {monthlyStats[m.key]?.total > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {formatCurrency(monthlyStats[m.key]?.won || 0)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>
    </div>
  );
};

// ==================== COMPONENT: MONTH STATS CARD ====================
const MonthStatsCard = ({ title, value, subtext, icon: Icon, trend, trendUp, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/25',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 font-medium mb-1 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{value}</p>
          {subtext && <p className="text-[10px] text-gray-400 mt-1 truncate">{subtext}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0 ml-2`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend}%</span>
          <span className="text-gray-400 font-normal">เทียบ</span>
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENT: DEAL CARD ====================
const DealCard = ({ deal, onClick, onDragStart, isDragging, teamMembers = [] }) => {
  const stage = STAGES.find(s => s.id === deal.stage) || STAGES[0];
  const daysSinceCreated = Math.floor((new Date() - new Date(deal.createdAt)) / (1000 * 60 * 60 * 24));
  const daysSinceActivity = deal.lastActivity
    ? Math.floor((new Date() - new Date(deal.lastActivity)) / (1000 * 60 * 60 * 24))
    : daysSinceCreated;

  const getAgingColor = () => {
    if (daysSinceActivity <= 3) return 'text-emerald-600 bg-emerald-50';
    if (daysSinceActivity <= 7) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getPriorityBadge = () => {
    if (deal.value >= 500000) return { text: 'HOT', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (deal.value >= 100000) return { text: 'WARM', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return null;
  };

  // Next Action Logic
  const getNextAction = () => {
    if (deal.stage === 'negotiation' && (deal.probability || 0) >= 70) return { text: '💰 ปิดดีลได้เลย!', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (deal.stage === 'negotiation') return { text: '🤝 นัดประชุมปิด', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    if (deal.stage === 'proposal') return { text: daysSinceActivity >= 3 ? '📞 ติดตามด่วน!' : '📞 ติดตาม Proposal', color: daysSinceActivity >= 3 ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-200' };
    if (deal.stage === 'contact') return { text: '📄 ส่ง Proposal', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (deal.stage === 'lead') return { text: '📞 โทรรับสาย', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    return null;
  };

  const priority = getPriorityBadge();
  const nextAction = getNextAction();
  const assignee = teamMembers.find(m => m.id === deal.assigned_to);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={() => onClick(deal)}
      className={`bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all cursor-pointer group ${isDragging ? 'opacity-50 rotate-1' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[10px] font-medium text-gray-500 truncate">{deal.company}</p>
          <h4 className="font-bold text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors leading-tight">{deal.title}</h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {priority && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${priority.color} whitespace-nowrap`}>
              {priority.text}
            </span>
          )}
          {assignee && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[9px] shadow-sm flex-shrink-0"
              style={{ backgroundColor: assignee.color }}
              title={assignee.name}
            >
              {assignee.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-blue-600">{formatCurrency(deal.value)}</span>
        {deal.probability > 0 && (
          <span className="text-[10px] font-medium text-gray-500">{deal.probability}%</span>
        )}
      </div>

      {/* Next Action Chip */}
      {nextAction && (
        <div className={`mb-2 px-2 py-1 rounded-lg text-[10px] font-bold border w-full text-center ${nextAction.color}`}>
          {nextAction.text}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getAgingColor()}`}>
          <Clock size={10} />
          {daysSinceActivity === 0 ? 'วันนี้' : `${daysSinceActivity}d`}
        </div>

        {deal.tasks?.filter(t => !t.completed).length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
            <CheckCircle2 size={10} />
            {deal.tasks.filter(t => !t.completed).length}
          </div>
        )}

        {deal.ai_score && (
          <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deal.ai_score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            AI {deal.ai_score}%
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENT: STAGE COLUMN ====================
const StageColumn = ({ stage, deals, onDrop, onDealClick, onDragStart, draggedDeal, teamMembers = [] }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const Icon = stage.icon;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(stage.id);
  };

  return (
    <div
      className={`flex-shrink-0 w-[260px] flex flex-col rounded-2xl transition-all ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header - Compact */}
      <div className={`p-3 rounded-t-2xl bg-gradient-to-r ${stage.color}`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Icon size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm">{stage.title}</h3>
              <p className="text-[10px] text-white/80">{stage.titleEn}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{deals.length}</p>
            <p className="text-[10px] text-white/80">ดีล</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/20">
          <p className="text-[10px] text-white/80 uppercase tracking-wide">มูลค่ารวม</p>
          <p className="text-base font-bold">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Deals List - Compact */}
      <div className={`flex-1 p-2 space-y-2 min-h-[350px] max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar ${stage.bgColor}`}>
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Plus size={18} />
            </div>
            <p className="text-xs">ไม่มีดีล</p>
            <p className="text-[10px] text-gray-400 mt-0.5">ลากดีลมาวาง</p>
          </div>
        ) : (
          deals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={onDealClick}
              onDragStart={onDragStart}
              isDragging={draggedDeal?.id === deal.id}
              teamMembers={teamMembers}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENT: QUICK ACTIONS BAR ====================
const QuickActionsBar = ({ onAddDeal, onExport, onFilter, viewMode, setViewMode, searchTerm, setSearchTerm }) => {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onAddDeal}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">เพิ่มดีล</span>
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium text-sm transition-all ${viewMode === 'board' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">บอร์ด</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium text-sm transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={14} />
            <span className="hidden sm:inline">รายการ</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium text-sm transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarDays size={14} />
            <span className="hidden sm:inline">ปฏิทิน</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาดีล, บริษัท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-44 lg:w-56"
          />
        </div>

        <button
          onClick={onFilter}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <Filter size={16} />
          <span className="hidden sm:inline">ตัวกรอง</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <Download size={16} />
          <span className="hidden lg:inline">ส่งออก</span>
        </button>
      </div>
    </div>
  );
};

// ==================== COMPONENT: MONTHLY ANALYTICS ====================
const MonthlyAnalytics = ({ deals, monthlyTarget = 1000000, teamMembers = [] }) => {
  const stats = useMemo(() => {
    const won = deals.filter(d => d.stage === 'won');
    const lost = deals.filter(d => d.stage === 'lost');
    const active = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');

    const wonValue = won.reduce((sum, d) => sum + (d.value || 0), 0);
    const lostValue = lost.reduce((sum, d) => sum + (d.value || 0), 0);
    const pipelineValue = active.reduce((sum, d) => sum + (d.value || 0), 0);

    const avgDealSize = deals.length > 0 ? (wonValue + pipelineValue) / deals.length : 0;
    const winRate = (won.length + lost.length) > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;

    return {
      totalDeals: deals.length,
      wonCount: won.length,
      lostCount: lost.length,
      activeCount: active.length,
      wonValue,
      lostValue,
      pipelineValue,
      avgDealSize,
      winRate,
      targetProgress: Math.min(100, (wonValue / monthlyTarget) * 100)
    };
  }, [deals, monthlyTarget]);

  // Per-member stats
  const memberStats = useMemo(() => {
    return teamMembers.map(m => {
      const myDeals = deals.filter(d => d.assigned_to === m.id);
      const wonValue = myDeals.filter(d => d.stage === 'won').reduce((s, d) => s + (d.value || 0), 0);
      const pct = Math.round(Math.min(100, (wonValue / m.goal) * 100));
      return { ...m, wonValue, pct };
    });
  }, [deals, teamMembers]);

  return (
    <div className="space-y-3">
      {/* Team Mini-Scoreboard */}
      {teamMembers.length > 0 && (
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">📊 Team Scoreboard (เดือนนี้)</p>
          <div className="flex gap-3">
            {memberStats.map(m => (
              <div key={m.id} className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black text-[8px]" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                    <span className="text-[10px] font-bold text-gray-700">{m.name}</span>
                  </div>
                  <span className="text-[10px] font-black" style={{ color: m.color }}>{m.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">{formatCurrency(m.wonValue)} / {formatCurrency(m.goal)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MonthStatsCard
          title="ยอดขายสำเร็จ"
          value={formatCurrency(stats.wonValue)}
          subtext={`${stats.wonCount} ดีลที่ปิดได้`}
          icon={DollarSign}
          color="emerald"
        />
        <MonthStatsCard
          title="เป้าหมายรายเดือน"
          value={`${stats.targetProgress.toFixed(0)}%`}
          subtext={formatCurrency(monthlyTarget)}
          icon={Target}
          color="blue"
        />
        <MonthStatsCard
          title="มูลค่าใน Pipeline"
          value={formatCurrency(stats.pipelineValue)}
          subtext={`${stats.activeCount} ดีลกำลังเจรจา`}
          icon={Activity}
          color="indigo"
        />
        <MonthStatsCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtext={`${stats.lostCount} ดีลหลุด (${formatCurrency(stats.lostValue)})`}
          icon={Award}
          color="amber"
        />
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const MonthlyPipeline = ({ deals: allDeals, onDealClick, onAddDeal, onUpdateDeal, monthlyTarget = 1000000, teamMembers = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('board'); // 'board', 'list', 'calendar', 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Advanced filters state
  const [filters, setFilters] = useState({
    stages: ['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost'],
    minValue: '',
    maxValue: '',
    startDate: '',
    endDate: '',
    priority: null,
    searchTerm: ''
  });

  // Filter deals by current month and advanced filters
  const monthlyDeals = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return allDeals.filter(deal => {
      const dealDate = new Date(deal.createdAt);
      const matchesMonth = dealDate.getFullYear() === year && dealDate.getMonth() === month;

      if (!matchesMonth) return false;

      // Stage filter
      if (!filters.stages.includes(deal.stage)) return false;

      // Value filter
      const value = deal.value || 0;
      if (filters.minValue && value < Number(filters.minValue)) return false;
      if (filters.maxValue && value > Number(filters.maxValue)) return false;

      // Date range filter
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        if (dealDate < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59);
        if (dealDate > end) return false;
      }

      // Priority filter
      if (filters.priority) {
        if (filters.priority === 'hot' && value < 500000) return false;
        if (filters.priority === 'warm' && (value < 100000 || value >= 500000)) return false;
        if (filters.priority === 'cold' && value >= 100000) return false;
      }

      // Search term
      const search = (searchTerm || filters.searchTerm).toLowerCase();
      if (search) {
        return (
          deal.title?.toLowerCase().includes(search) ||
          deal.company?.toLowerCase().includes(search) ||
          deal.contact?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [allDeals, currentDate, searchTerm, filters]);

  // Calculate monthly stats for all months
  const monthlyStats = useMemo(() => {
    const stats = {};
    allDeals.forEach(deal => {
      const date = new Date(deal.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!stats[key]) {
        stats[key] = { total: 0, won: 0, count: 0 };
      }

      stats[key].total += deal.value || 0;
      stats[key].count += 1;

      if (deal.stage === 'won') {
        stats[key].won += deal.value || 0;
      }
    });
    return stats;
  }, [allDeals]);

  // Drag handlers
  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (stageId) => {
    if (!draggedDeal) return;

    if (draggedDeal.stage !== stageId) {
      setLoading(true);
      await onUpdateDeal(draggedDeal.id, { stage: stageId });
      setLoading(false);
    }
    setDraggedDeal(null);
  };

  // Export monthly deals
  const handleExport = () => {
    const headers = ['Title', 'Company', 'Contact', 'Value', 'Stage', 'Assigned To', 'Created At'];
    const rows = monthlyDeals.map(d => [
      d.title,
      d.company,
      d.contact,
      d.value,
      d.stage,
      teamMembers.find(m => m.id === d.assigned_to)?.name || d.assigned_to || '-',
      d.createdAt
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pipeline_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.csv`;
    link.click();
  };

  const handleClearFilters = () => {
    setFilters({
      stages: ['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost'],
      minValue: '',
      maxValue: '',
      startDate: '',
      endDate: '',
      priority: null,
      searchTerm: ''
    });
    setSearchTerm('');
  };

  // Get active deals for aging report (non-won, non-lost)
  const activeDeals = useMemo(() => {
    return monthlyDeals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
  }, [monthlyDeals]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header - Compact */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sales Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">จัดการดีลตามรอบเดือน เพื่อติดตามยอดขายและเป้าหมาย</p>
        </div>
        <MonthSelector
          currentDate={currentDate}
          onChange={setCurrentDate}
          monthlyStats={monthlyStats}
        />
      </div>

      {/* Monthly Stats */}
      <MonthlyAnalytics deals={monthlyDeals} monthlyTarget={monthlyTarget} teamMembers={teamMembers} />

      {/* Quick Actions */}
      <div className="flex items-center justify-between gap-3">
        <QuickActionsBar
          onAddDeal={onAddDeal}
          onExport={handleExport}
          onFilter={() => { }}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <div className="flex items-center gap-2">
          <PipelineFilters
            filters={filters}
            onChange={setFilters}
            onClear={handleClearFilters}
            dealCount={monthlyDeals.length}
          />
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-all ${showAnalytics
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <BarChart3 size={16} />
            <span className="hidden sm:inline">วิเคราะห์</span>
          </button>
        </div>
      </div>

      {/* Pipeline Board with optional Analytics Sidebar */}
      <div className="flex-1 flex gap-3 min-h-0">
        <div className={`flex-1 min-h-0 ${showAnalytics ? 'w-3/4' : 'w-full'}`}>
          {viewMode === 'board' && (
            <div className="h-full overflow-x-auto overflow-y-hidden pb-2">
              <div className="flex gap-3 h-full min-w-max px-0.5">
                {STAGES.map(stage => (
                  <StageColumn
                    key={stage.id}
                    stage={stage}
                    deals={monthlyDeals.filter(d => d.stage === stage.id)}
                    onDrop={handleDrop}
                    onDealClick={onDealClick}
                    onDragStart={handleDragStart}
                    draggedDeal={draggedDeal}
                    teamMembers={teamMembers}
                  />
                ))}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="h-full overflow-auto bg-white rounded-2xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ดีล</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">บริษัท</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">มูลค่า</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">มอบหมาย</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">วันที่สร้าง</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">AI Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyDeals.map(deal => {
                    const stage = STAGES.find(s => s.id === deal.stage);
                    const assignee = teamMembers.find(m => m.id === deal.assigned_to);
                    return (
                      <tr
                        key={deal.id}
                        onClick={() => onDealClick(deal)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{deal.title}</p>
                            <p className="text-xs text-gray-500">{deal.contact}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{deal.company}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{formatCurrency(deal.value)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${stage?.bgColor} ${stage?.textColor}`}>
                            {stage?.title}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]" style={{ backgroundColor: assignee.color }}>
                                {assignee.name.charAt(0)}
                              </div>
                              <span className="text-xs font-medium text-gray-700">{assignee.name}</span>
                            </div>
                          ) : <span className="text-xs text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(deal.createdAt)}</td>
                        <td className="px-4 py-3">
                          {deal.ai_score ? (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${deal.ai_score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {deal.ai_score}%
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'calendar' && (
            <div className="h-full overflow-auto">
              <MonthlyCalendarView
                deals={monthlyDeals}
                currentDate={currentDate}
                onDealClick={onDealClick}
              />
            </div>
          )}
        </div>

        {/* Analytics Sidebar */}
        {showAnalytics && (
          <div className="w-72 flex-shrink-0 space-y-3 overflow-y-auto pb-2">
            <MonthlyComparison
              deals={allDeals}
              currentDate={currentDate}
            />
            <DealAgingReport
              deals={activeDeals}
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <span className="font-medium text-gray-700">กำลังอัพเดท...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENT: MONTHLY CALENDAR VIEW ====================
const MonthlyCalendarView = ({ deals, currentDate, onDealClick }) => {
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const dealsByDate = useMemo(() => {
    const map = {};
    deals.forEach(deal => {
      const date = new Date(deal.createdAt).getDate();
      if (!map[date]) map[date] = [];
      map[date].push(deal);
    });
    return map;
  }, [deals]);

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 overflow-auto">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[100px] p-2 rounded-xl border ${day ? 'bg-gray-50 border-gray-100' : 'bg-transparent border-transparent'} ${day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'ring-2 ring-blue-500' : ''}`}
          >
            {day && (
              <>
                <span className="text-sm font-medium text-gray-700">{day}</span>
                <div className="mt-1 space-y-1">
                  {dealsByDate[day]?.slice(0, 3).map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => onDealClick(deal)}
                      className="text-[10px] p-1.5 rounded-lg bg-blue-100 text-blue-700 truncate cursor-pointer hover:bg-blue-200 transition-colors"
                    >
                      {deal.title}
                    </div>
                  ))}
                  {dealsByDate[day]?.length > 3 && (
                    <div className="text-[10px] text-gray-500 text-center">
                      +{dealsByDate[day].length - 3} ดีล
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyPipeline;
