import { useState, useMemo } from 'react';
import {
    DollarSign, AlertTriangle, Zap,
    TrendingUp, Target, Trophy, Users, Clock,
    Flame, Activity, Sparkles, Loader2, X
} from 'lucide-react';

// ─── Utility ────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);
const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);

// ─── Sub-components ──────────────────────────────────────────────────────────
const BattlePlanCard = ({ icon: Icon, label, count, value, color, urgent, onClick }) => (
    <div
        onClick={onClick}
        className={`relative flex flex-col gap-1.5 p-3 rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg ${urgent ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-white border-gray-100 shadow-sm'}`}
    >
        {urgent && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={16} />
        </div>
        <div>
            <p className="text-xs font-black text-text-muted uppercase tracking-wider">{label}</p>
            <p className="text-xl font-black text-gray-800">{count}</p>
            {value > 0 && <p className="text-xs font-medium text-gray-400 mt-1">{fmt(value)}</p>}
        </div>
    </div>
);

const UrgentDealRow = ({ deal, teamMembers, onDealClick }) => {
    const days = daysSince(deal.lastActivity || deal.createdAt);
    const assignee = teamMembers?.find(m => m.id === deal.assigned_to);
    return (
        <div
            onClick={() => onDealClick(deal)}
            className="flex items-center gap-2 p-2 bg-white rounded-xl border border-red-50 hover:border-red-200 hover:shadow-sm cursor-pointer transition-all group"
        >
            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${days >= 14 ? 'bg-red-500' : days >= 7 ? 'bg-orange-400' : 'bg-amber-300'}`} />
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800 truncate group-hover:text-red-600 transition-colors">{deal.title}</p>
                <p className="text-xs text-gray-500 truncate">{deal.company}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-black text-blue-600">{fmt(deal.value)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${days >= 7 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    <Clock size={10} />{days}d
                </span>
            </div>
            {assignee && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0" style={{ backgroundColor: assignee.color }}>
                    {assignee.name.charAt(0)}
                </div>
            )}
        </div>
    );
};

const HotDealRow = ({ deal, teamMembers, onDealClick }) => {
    const assignee = teamMembers?.find(m => m.id === deal.assigned_to);
    return (
        <div
            onClick={() => onDealClick(deal)}
            className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-50 hover:border-emerald-200 hover:shadow-sm cursor-pointer transition-all group"
        >
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Flame size={14} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800 truncate group-hover:text-emerald-600">{deal.title}</p>
                <p className="text-xs text-gray-500 truncate">{deal.company} · {deal.probability}%</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-black text-emerald-600">{fmt(deal.value)}</span>
                {assignee && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: assignee.color }}>
                        {assignee.name.charAt(0)}
                    </div>
                )}
            </div>
        </div>
    );
};

const BattlePlanModal = ({ plan, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black flex items-center gap-2">
                        <Sparkles /> AI Strategic Battle Plan
                    </h3>
                    <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-[10px] mt-1">Daily Strategy Insight (Thai Language)</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all relative z-10"><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed text-gray-700 font-medium">
                {plan}
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end">
                <button onClick={onClose} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-indigo-200 shadow-xl hover:bg-indigo-700 transition-all active:scale-95">รับทราบภารกิจ!</button>
            </div>
        </div>
    </div>
);

// ─── Main Command Center ─────────────────────────────────────────────────────
const CommandCenter = ({
    deals, teamMembers = [], monthlyGoal = 10000000,
    onDealClick, onAddDeal, onGeneratePlan, isGeneratingPlan, battlePlan,
    strategicMandates = [], isGeneratingMandates, onGenerateMandates,
    zenithMode, focusMode, setFocusMode
}) => {
    const headerDate = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const [showBattlePlan, setShowBattlePlan] = useState(false);

    const stats = useMemo(() => {
        const today = new Date();
        const currentMonthDeals = deals.filter(d =>
            new Date(d.createdAt).getMonth() === today.getMonth() &&
            new Date(d.createdAt).getFullYear() === today.getFullYear()
        );
        const wonDeals = currentMonthDeals.filter(d => d.stage === 'won');
        const wonRevenue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
        const pipelineDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
        const pipelineValue = pipelineDeals.reduce((s, d) => s + (d.value || 0), 0);
        const totalClosed = deals.filter(d => ['won', 'lost'].includes(d.stage)).length;
        const winRate = totalClosed > 0 ? Math.round((deals.filter(d => d.stage === 'won').length / totalClosed) * 100) : 0;
        const gap = Math.max(0, monthlyGoal - wonRevenue);
        const pct = Math.round(Math.min(100, (wonRevenue / monthlyGoal) * 100));

        const urgent = pipelineDeals
            .filter(d => daysSince(d.lastActivity || d.createdAt) >= 7)
            .sort((a, b) => daysSince(b.lastActivity || b.createdAt) - daysSince(a.lastActivity || a.createdAt));

        const warm = pipelineDeals
            .filter(d => { const ds = daysSince(d.lastActivity || d.createdAt); return ds >= 3 && ds < 7; })
            .sort((a, b) => b.value - a.value);

        const hot = pipelineDeals
            .filter(d => d.stage === 'negotiation' || (d.probability || 0) >= 60)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const forecast = wonRevenue + pipelineDeals.reduce((s, d) => s + ((d.value || 0) * ((d.probability || 30) / 100)), 0);

        // Focus Mode Filtering: Dim low value deals
        const displayUrgent = focusMode ? urgent.filter(d => d.value >= 500000) : urgent;
        const displayWarm = focusMode ? warm.filter(d => d.value >= 500000) : warm;
        const displayHot = focusMode ? hot.filter(d => d.value >= 500000) : hot;

        return { wonRevenue, pipelineValue, winRate, gap, pct, urgent: displayUrgent, warm: displayWarm, hot: displayHot, forecast };
    }, [deals, monthlyGoal, focusMode]);

    const memberStats = useMemo(() => {
        const today = new Date();
        const currentMonthDeals = deals.filter(d =>
            new Date(d.createdAt).getMonth() === today.getMonth() &&
            new Date(d.createdAt).getFullYear() === today.getFullYear()
        );
        return teamMembers.map(m => {
            const mWon = currentMonthDeals.filter(d => d.assigned_to === m.id && d.stage === 'won').reduce((s, d) => s + (d.value || 0), 0);
            const mPipe = deals.filter(d => d.assigned_to === m.id && !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0);
            const mPct = Math.round(Math.min(100, (mWon / m.goal) * 100));
            const mGap = Math.max(0, m.goal - mWon);
            const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
            const dailyTarget = mGap > 0 && daysLeft > 0 ? mGap / daysLeft : 0;
            return { ...m, mWon, mPipe, mPct, mGap, dailyTarget, daysLeft };
        });
    }, [deals, teamMembers]);

    return (
        <div className="space-y-4 pb-6 max-w-7xl mx-auto px-4 h-full overflow-y-auto custom-scrollbar">
            {/* ─── HEADER ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        🏠 Command Center
                        {zenithMode && <span className="text-xs bg-gradient-to-r from-amber-400 to-yellow-600 px-3 py-1 rounded-full text-white animate-pulse">ZENITH MODE</span>}
                    </h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{headerDate}</p>
                </div>
                <div className="flex items-center gap-3">
                    {zenithMode && (
                        <button
                            onClick={() => setFocusMode(!focusMode)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all border-2 ${focusMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-50'}`}
                        >
                            <Target size={14} /> {focusMode ? 'FOCUS ON (High-Value Only)' : 'FOCUS OFF'}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (battlePlan) setShowBattlePlan(true);
                            else onGeneratePlan();
                        }}
                        disabled={isGeneratingPlan}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg ${isGeneratingPlan ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-indigo-500/30 hover:shadow-xl'}`}
                    >
                        {isGeneratingPlan ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isGeneratingPlan ? 'กำลังวางแผน...' : (battlePlan ? 'อ่านแผนกลยุทธ์' : 'AI วางแผนการขาย')}
                    </button>
                    <button
                        onClick={onAddDeal}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-indigo-600 border-2 border-indigo-50 rounded-xl font-bold text-xs hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                    >
                        + เพิ่มดีลด่วน
                    </button>
                </div>
            </div>

            {/* ─── ZENITH STRATEGIC MANDATES ────────────────────────── */}
            {zenithMode && (
                <div className="bg-surface rounded-3xl p-6 border border-amber-200/20 glass-glow">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <Zap className="text-amber-400" /> Strategic Mandates
                            </h2>
                            <p className="text-xs text-white/60 font-medium">AI-Driven Market Orchestration</p>
                        </div>
                        <button
                            onClick={onGenerateMandates}
                            disabled={isGeneratingMandates}
                            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all active:scale-95 ${isGeneratingMandates ? 'bg-white/10 text-white/40' : 'bg-white text-indigo-900 hover:bg-amber-400 hover:text-white shadow-xl shadow-amber-500/10'}`}
                        >
                            {isGeneratingMandates ? <Loader2 size={14} className="animate-spin" /> : 'REFRESH STRATEGY'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {strategicMandates.length > 0 ? (
                            strategicMandates.map((m, i) => (
                                <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-amber-400/50 transition-all group">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${m.urgency === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        <Target size={18} />
                                    </div>
                                    <h3 className="font-bold text-sm text-white mb-2 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{m.mandate}</h3>
                                    <p className="text-xs text-white/50 leading-relaxed font-medium">{m.desc}</p>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <p className="text-sm text-white/30 font-bold uppercase tracking-widest">No Active Mandates. Click Refresh to Orchestrate.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── DEAL AGING ALERT BANNER ──────────────────────────── */}
            {stats.urgent.length > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-3 text-white flex items-center gap-3 shadow-lg shadow-red-500/20">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-xs tracking-tight">⚠️ มี {stats.urgent.length} ดีลค้างนานเกิน 7 วัน!</p>
                        <p className="text-[10px] text-white/80">มูลค่ารวม {fmt(stats.urgent.reduce((s, d) => s + (d.value || 0), 0))}</p>
                    </div>
                </div>
            )}

            {/* ─── BATTLE PLAN CARDS ────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <BattlePlanCard
                    icon={AlertTriangle}
                    label="ต้องติดตามด่วน (>7d)"
                    count={stats.urgent.length}
                    value={stats.urgent.reduce((s, d) => s + (d.value || 0), 0)}
                    color="bg-red-50 text-red-600"
                    urgent={stats.urgent.length > 0}
                />
                <BattlePlanCard
                    icon={Clock}
                    label="ค้าง 3-6 วัน (warm)"
                    count={stats.warm.length}
                    value={stats.warm.reduce((s, d) => s + (d.value || 0), 0)}
                    color="bg-amber-50 text-amber-600"
                    urgent={false}
                />
                <BattlePlanCard
                    icon={Flame}
                    label="ดีลร้อน ปิดได้เลย"
                    count={stats.hot.length}
                    value={stats.hot.reduce((s, d) => s + (d.value || 0), 0)}
                    color="bg-emerald-50 text-emerald-600"
                    urgent={false}
                />
                <BattlePlanCard
                    icon={Target}
                    label="Gap เป้าเดือนนี้"
                    count={`${stats.pct}%`}
                    value={stats.gap}
                    color={stats.pct >= 80 ? 'bg-emerald-50 text-emerald-600' : stats.pct >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}
                    urgent={stats.pct < 30}
                />
            </div>

            {/* ─── STATS ROW ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Won เดือนนี้', value: fmt(stats.wonRevenue), icon: DollarSign, color: 'text-emerald-600' },
                    { label: 'Pipeline รวม', value: fmt(stats.pipelineValue), icon: Activity, color: 'text-blue-600' },
                    { label: 'Win Rate', value: `${stats.winRate}%`, icon: TrendingUp, color: 'text-indigo-600' },
                    { label: 'AI Forecast', value: fmt(stats.forecast), icon: Zap, color: 'text-purple-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center ${s.color}`}>
                            <s.icon size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">{s.label}</p>
                            <p className="text-base font-black text-gray-800">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── MISSION CONTROL ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Team Gauges */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm text-gray-700 uppercase tracking-tight flex items-center gap-2">
                            <Users size={16} className="text-indigo-500" /> Team Progress
                        </h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${stats.pct >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {stats.pct}% ทีม
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            <span>🏆 ทีมรวม</span>
                            <span>{fmt(stats.wonRevenue)} / {fmt(monthlyGoal)}</span>
                        </div>
                        <div className="h-3 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${stats.pct}%` }} />
                        </div>
                    </div>

                    {memberStats.map(m => (
                        <div key={m.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black text-[8px]" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                    <span className="text-[11px] font-bold text-gray-700">{m.name}</span>
                                </div>
                                <span className="text-[10px] font-black" style={{ color: m.color }}>{m.mPct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.mPct}%`, backgroundColor: m.color }} />
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-400">
                                <span>{fmt(m.mWon)} / {fmt(m.mPipe)}</span>
                                <span className="font-bold text-gray-500">Gap {fmt(m.mGap)} ({m.daysLeft}d)</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CENTER: Urgent Deals */}
                <div className="bg-white rounded-2xl border border-red-50 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-xs text-gray-700 uppercase tracking-tight flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-500" /> ดีลค้าง — ต้องแก้ตอนนี้
                        </h3>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">{stats.urgent.length + stats.warm.length}</span>
                    </div>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {[...stats.urgent, ...stats.warm].slice(0, 8).map(deal => (
                            <UrgentDealRow key={deal.id} deal={deal} teamMembers={teamMembers} onDealClick={onDealClick} />
                        ))}
                    </div>
                </div>

                {/* RIGHT: Hot Deals + Leaderboard */}
                <div className="space-y-4">
                    <div className="bg-emerald-50/30 rounded-2xl border border-emerald-100 shadow-sm p-4">
                        <h3 className="font-black text-xs text-gray-700 uppercase tracking-tight flex items-center gap-2 mb-3">
                            <Flame size={14} className="text-emerald-500" /> ดีลร้อน — ปิดได้เลย
                        </h3>
                        <div className="space-y-1.5">
                            {stats.hot.slice(0, 3).map(deal => (
                                <HotDealRow key={deal.id} deal={deal} teamMembers={teamMembers} onDealClick={onDealClick} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4">
                        <h3 className="font-black text-xs text-gray-700 uppercase tracking-tight flex items-center gap-2 mb-3">
                            <Trophy size={14} className="text-amber-500" /> Leaderboard
                        </h3>
                        <div className="space-y-2">
                            {memberStats.sort((a, b) => b.mWon - a.mWon).map((m, i) => (
                                <div key={m.id} className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-gray-300 w-3">{i + 1}</span>
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[9px]" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-700 truncate">{m.name}</p>
                                        <p className="text-[8px] text-gray-400">{fmt(m.mWon)}</p>
                                    </div>
                                    <p className="text-[10px] font-black" style={{ color: m.color }}>{m.mPct}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── QUICK VIEW ───────────────────── */}
            {deals.filter(d => !['won', 'lost'].includes(d.stage)).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-xs text-gray-700 uppercase tracking-tight flex items-center gap-2">
                            <Activity size={14} className="text-blue-500" /> Active Pipeline
                        </h3>
                        <span className="text-[10px] text-gray-400">{deals.filter(d => !['won', 'lost'].includes(d.stage)).length} ดีล</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {deals.filter(d => !['won', 'lost'].includes(d.stage)).sort((a, b) => b.value - a.value).slice(0, 6).map(deal => {
                            const daysOld = daysSince(deal.lastActivity || deal.createdAt);
                            return (
                                <div key={deal.id} onClick={() => onDealClick(deal)} className="p-2 border border-gray-50 rounded-xl hover:border-blue-100 cursor-pointer transition-all bg-gray-50/30">
                                    <p className="text-[10px] font-bold text-gray-800 truncate">{deal.title}</p>
                                    <p className="text-[11px] font-black text-blue-600 mt-0.5">{fmt(deal.value)}</p>
                                    <p className="text-[8px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={8} /> {daysOld}d idle</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* modals */}
            {showBattlePlan && battlePlan && <BattlePlanModal plan={battlePlan} onClose={() => setShowBattlePlan(false)} />}
            {!showBattlePlan && battlePlan && !isGeneratingPlan && (
                <div className="fixed bottom-8 right-8 z-50 animate-bounce">
                    <button onClick={() => setShowBattlePlan(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-4 border-white">
                        <Sparkles size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CommandCenter;
