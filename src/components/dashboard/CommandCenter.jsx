import { useMemo } from 'react';
import {
    DollarSign, AlertTriangle, Zap,
    TrendingUp, Target, Trophy, Users, Clock,
    CheckCircle2, Flame, Activity
} from 'lucide-react';

// ─── Utility ────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);
const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);

// ─── Next Action Logic ───────────────────────────────────────────────────────
const getNextAction = (deal) => {
    const days = daysSince(deal.lastActivity || deal.createdAt);
    if (deal.stage === 'negotiation' && (deal.probability || 0) >= 70) return { text: '💰 ปิดดีลได้เลย!', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', urgent: true };
    if (deal.stage === 'negotiation') return { text: '🤝 นัดประชุมปิด', color: 'text-orange-700 bg-orange-50 border-orange-200', urgent: false };
    if (deal.stage === 'proposal') return { text: '📞 ติดตาม Proposal', color: 'text-blue-700 bg-blue-50 border-blue-200', urgent: days >= 3 };
    if (deal.stage === 'contact') return { text: '📄 ส่ง Proposal', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', urgent: days >= 5 };
    if (deal.stage === 'lead') return { text: '📞 โทรรับสาย', color: 'text-purple-700 bg-purple-50 border-purple-200', urgent: days >= 7 };
    return null;
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const BattlePlanCard = ({ icon: Icon, label, count, value, color, urgent, onClick }) => (
    <div
        onClick={onClick}
        className={`relative flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg ${urgent ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-white border-gray-100 shadow-sm'
            }`}
    >
        {urgent && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-xs font-bold text-gray-500">{label}</p>
            <p className="text-2xl font-black text-gray-800">{count}</p>
            {value > 0 && <p className="text-xs text-gray-500 mt-0.5">{fmt(value)}</p>}
        </div>
    </div>
);

const UrgentDealRow = ({ deal, teamMembers, onDealClick }) => {
    const days = daysSince(deal.lastActivity || deal.createdAt);
    const action = getNextAction(deal);
    const assignee = teamMembers?.find(m => m.id === deal.assigned_to);
    return (
        <div
            onClick={() => onDealClick(deal)}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-red-100 hover:border-red-300 hover:shadow-md cursor-pointer transition-all group"
        >
            <div className={`w-2 self-stretch rounded-full flex-shrink-0 ${days >= 14 ? 'bg-red-500' : days >= 7 ? 'bg-orange-400' : 'bg-amber-300'}`} />
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800 truncate group-hover:text-red-600 transition-colors">{deal.title}</p>
                <p className="text-[10px] text-gray-500 truncate">{deal.company}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-black text-blue-600">{fmt(deal.value)}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${days >= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <Clock size={9} />{days}d ไม่ได้แตะ
                </span>
            </div>
            {assignee && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black flex-shrink-0" style={{ backgroundColor: assignee.color }}>
                    {assignee.name.charAt(0)}
                </div>
            )}
            {action && (
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex-shrink-0 hidden lg:block ${action.color}`}>
                    {action.text}
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
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
        >
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800 truncate group-hover:text-emerald-600">{deal.title}</p>
                <p className="text-[10px] text-gray-500">{deal.company} · {deal.probability || 0}% prob</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-black text-emerald-600">{fmt(deal.value)}</span>
                {assignee && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{ backgroundColor: assignee.color }}>
                        {assignee.name.charAt(0)}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Command Center ─────────────────────────────────────────────────────
const CommandCenter = ({ deals, teamMembers = [], monthlyGoal = 10000000, onDealClick, onAddDeal }) => {
    const headerDate = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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

        // Urgent: active deals not touched in 7+ days
        const urgent = pipelineDeals
            .filter(d => daysSince(d.lastActivity || d.createdAt) >= 7)
            .sort((a, b) => daysSince(b.lastActivity || b.createdAt) - daysSince(a.lastActivity || a.createdAt));

        // Warm: 3-6 days no touch
        const warm = pipelineDeals
            .filter(d => { const ds = daysSince(d.lastActivity || d.createdAt); return ds >= 3 && ds < 7; })
            .sort((a, b) => b.value - a.value);

        // Hot: negotiation or high probability
        const hot = pipelineDeals
            .filter(d => d.stage === 'negotiation' || (d.probability || 0) >= 60)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // AI Forecast
        const forecast = wonRevenue + pipelineDeals.reduce((s, d) => s + ((d.value || 0) * ((d.probability || 30) / 100)), 0);

        return { wonRevenue, pipelineValue, winRate, gap, pct, urgent, warm, hot, forecast };
    }, [deals, monthlyGoal]);

    // Team per-member stats
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
            const dailyTarget = daysLeft > 0 ? mGap / daysLeft : 0;
            return { ...m, mWon, mPipe, mPct, mGap, dailyTarget, daysLeft };
        });
    }, [deals, teamMembers]);

    return (
        <div className="space-y-6 pb-10 max-w-7xl mx-auto">
            {/* ─── HEADER ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">🏠 Command Center</h1>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {headerDate}
                    </p>
                </div>
                <button
                    onClick={onAddDeal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="text-lg leading-none">+</span> เพิ่มดีลด่วน
                </button>
            </div>

            {/* ─── DEAL AGING ALERT BANNER ──────────────────────────── */}
            {stats.urgent.length > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white flex items-center gap-4 shadow-lg shadow-red-500/20">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm">⚠️ มี {stats.urgent.length} ดีลค้างนานเกิน 7 วัน! ปล่อยไว้จะหลุด</p>
                        <p className="text-xs text-white/80 mt-0.5">มูลค่ารวม {fmt(stats.urgent.reduce((s, d) => s + (d.value || 0), 0))} กำลังเสี่ยง</p>
                    </div>
                    <div className="text-white/80 text-xs font-bold">เลื่อนลงดูด้านล่าง ↓</div>
                </div>
            )}

            {/* ─── BATTLE PLAN CARDS ────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <BattlePlanCard
                    icon={AlertTriangle}
                    label="ต้องติดตามด่วน (>7d)"
                    count={stats.urgent.length}
                    value={stats.urgent.reduce((s, d) => s + (d.value || 0), 0)}
                    color="bg-red-100 text-red-600"
                    urgent={stats.urgent.length > 0}
                />
                <BattlePlanCard
                    icon={Clock}
                    label="ค้าง 3-6 วัน (warm)"
                    count={stats.warm.length}
                    value={stats.warm.reduce((s, d) => s + (d.value || 0), 0)}
                    color="bg-amber-100 text-amber-600"
                    urgent={false}
                />
                <BattlePlanCard
                    icon={Flame}
                    label="ดีลร้อน ปิดได้เลย"
                    count={stats.hot.length}
                    value={stats.hot.reduce((s, d) => s + (d.value || 0), 0)}
                    color="bg-emerald-100 text-emerald-600"
                    urgent={false}
                />
                <BattlePlanCard
                    icon={Target}
                    label="Gap เป้าเดือนนี้"
                    count={`${stats.pct}%`}
                    value={stats.gap}
                    color={stats.pct >= 80 ? 'bg-emerald-100 text-emerald-600' : stats.pct >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}
                    urgent={stats.pct < 30}
                />
            </div>

            {/* ─── STATS ROW ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Won เดือนนี้', value: fmt(stats.wonRevenue), icon: DollarSign, color: 'text-emerald-600' },
                    { label: 'Pipeline รวม', value: fmt(stats.pipelineValue), icon: Activity, color: 'text-blue-600' },
                    { label: 'Win Rate', value: `${stats.winRate}%`, icon: TrendingUp, color: 'text-indigo-600' },
                    { label: 'AI Forecast', value: fmt(stats.forecast), icon: Zap, color: 'text-purple-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${s.color}`}>
                            <s.icon size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{s.label}</p>
                            <p className="text-base font-black text-gray-800">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── MISSION CONTROL ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: Team Gauges */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm text-gray-700 flex items-center gap-2"><Users size={16} className="text-indigo-500" /> Team Progress</h3>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${stats.pct >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{stats.pct}% ทีม</span>
                    </div>

                    {/* Team overall gauge */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                            <span>🏆 ทีมรวม</span>
                            <span>{fmt(stats.wonRevenue)} / {fmt(monthlyGoal)}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${stats.pct}%` }} />
                        </div>
                    </div>

                    {/* Per-member */}
                    {memberStats.map(m => (
                        <div key={m.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[9px]" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                    <span className="text-xs font-bold text-gray-700">{m.name}</span>
                                </div>
                                <span className="text-xs font-black" style={{ color: m.color }}>{m.mPct}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.mPct}%`, backgroundColor: m.color }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400">
                                <span>{fmt(m.mWon)} won · {fmt(m.mPipe)} pipe</span>
                                <span className="font-bold text-gray-500">Gap {fmt(m.mGap)} ({m.daysLeft}d เหลือ)</span>
                            </div>
                            {m.dailyTarget > 0 && (
                                <p className="text-[9px] font-bold text-orange-500">⚡ ต้องปิด/วัน: {fmt(m.dailyTarget)}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* CENTER: Urgent Deals */}
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-sm text-gray-700 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-500" /> ดีลค้าง — ต้องแก้ตอนนี้
                        </h3>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">{stats.urgent.length + stats.warm.length} ดีล</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {[...stats.urgent, ...stats.warm].slice(0, 8).map(deal => (
                            <UrgentDealRow key={deal.id} deal={deal} teamMembers={teamMembers} onDealClick={onDealClick} />
                        ))}
                        {stats.urgent.length === 0 && stats.warm.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 opacity-40">
                                <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                                <p className="text-sm font-bold text-gray-500">ทุกดีล Up-to-date! 🎉</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Hot Deals + Leaderboard */}
                <div className="space-y-4">
                    {/* Hot Deals */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-black text-sm text-gray-700 flex items-center gap-2">
                                <Flame size={16} className="text-emerald-500" /> ดีลร้อน — ปิดได้เลย
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {stats.hot.slice(0, 3).map(deal => (
                                <HotDealRow key={deal.id} deal={deal} teamMembers={teamMembers} onDealClick={onDealClick} />
                            ))}
                            {stats.hot.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีดีลที่พร้อมปิด</p>
                            )}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-black text-sm text-gray-700 flex items-center gap-2 mb-3">
                            <Trophy size={16} className="text-amber-500" /> Leaderboard เดือนนี้
                        </h3>
                        <div className="space-y-2">
                            {memberStats
                                .sort((a, b) => b.mWon - a.mWon)
                                .map((m, i) => (
                                    <div key={m.id} className="flex items-center gap-3">
                                        <span className="text-sm font-black text-gray-400 w-4">{i + 1}</span>
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs" style={{ backgroundColor: m.color }}>
                                            {m.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-700">{m.name}</p>
                                            <p className="text-[10px] text-gray-400">{fmt(m.mWon)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black" style={{ color: m.color }}>{m.mPct}%</p>
                                            <p className="text-[9px] text-gray-400">of goal</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── PIPELINE OVERVIEW AT A GLANCE ───────────────────── */}
            {deals.filter(d => !['won', 'lost'].includes(d.stage)).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-sm text-gray-700 flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" /> Active Pipeline — Quick View
                        </h3>
                        <span className="text-xs text-gray-400">{deals.filter(d => !['won', 'lost'].includes(d.stage)).length} ดีล</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {deals
                            .filter(d => !['won', 'lost'].includes(d.stage))
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 8)
                            .map(deal => {
                                const action = getNextAction(deal);
                                const assignee = teamMembers.find(m => m.id === deal.assigned_to);
                                const daysOld = daysSince(deal.lastActivity || deal.createdAt);
                                return (
                                    <div
                                        key={deal.id}
                                        onClick={() => onDealClick(deal)}
                                        className="p-3 border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-1.5">
                                            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-blue-600 flex-1 mr-1">{deal.title}</p>
                                            {assignee && (
                                                <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black text-[8px] flex-shrink-0" style={{ backgroundColor: assignee.color }}>
                                                    {assignee.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-500 truncate">{deal.company}</p>
                                        <p className="text-sm font-black text-blue-600 mt-1">{fmt(deal.value)}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold ${daysOld <= 3 ? 'bg-emerald-50 text-emerald-700' : daysOld <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                                <Clock size={8} />{daysOld}d
                                            </span>
                                            {action && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${action.color}`}>{action.text}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommandCenter;
