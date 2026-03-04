import { useMemo } from 'react';
import { Users, Target, TrendingUp, Zap, Trophy, AlertTriangle, ChevronRight, Star } from 'lucide-react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const formatShort = (amount) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount;
};

/* ── Circular Gauge Component ── */
const CircleGauge = ({ value, max, size = 120, strokeWidth = 10, color = '#7C6AF3' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
};

/* ── Member Card ── */
const MemberCard = ({ member, deals, formatCurrency, onDealClick }) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const myDeals = deals.filter(d => d.assigned_to === member.id);
  const wonThisMonth = myDeals.filter(d => d.stage === 'won' && new Date(d.updatedAt || d.createdAt) >= startOfMonth);
  const wonRevenue = wonThisMonth.reduce((s, d) => s + (d.value || 0), 0);
  const pipelineValue = myDeals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0);
  const pct = Math.round(Math.min(100, (wonRevenue / member.goal) * 100));
  const gap = Math.max(0, member.goal - wonRevenue);

  // Days left in month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;
  const dailyNeeded = daysLeft > 0 ? gap / daysLeft : 0;

  // Top deals (negotiation / proposal)
  const hotDeals = myDeals
    .filter(d => ['negotiation', 'proposal'].includes(d.stage))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const stageColors = { negotiation: '#F97316', proposal: '#EAB308', contact: '#3B82F6', lead: '#6B7280' };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header Band */}
      <div className="h-2" style={{ backgroundColor: member.color }} />

      <div className="p-6">
        {/* Member Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
              style={{ backgroundColor: member.color }}
            >
              {member.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-black text-text-main text-base">{member.name}</h3>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{member.role}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-text-muted uppercase">เป้าเดือนนี้</p>
            <p className="text-sm font-black" style={{ color: member.color }}>{formatShort(member.goal)}</p>
          </div>
        </div>

        {/* Gauge + Stats */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative flex-shrink-0">
            <CircleGauge value={wonRevenue} max={member.goal} size={110} strokeWidth={10} color={member.color} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-text-main">{pct}%</span>
              <span className="text-[9px] font-bold text-text-muted uppercase">Won</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800">
              <p className="text-[10px] font-black text-text-muted uppercase mb-0.5">ปิดได้แล้ว</p>
              <p className="text-base font-black text-text-main">{formatCurrency(wonRevenue)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20">
              <p className="text-[10px] font-black text-text-muted uppercase mb-0.5">Gap to Goal</p>
              <p className="text-base font-black text-orange-600">{formatCurrency(gap)}</p>
            </div>
          </div>
        </div>

        {/* Pipeline & Daily Rate */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-[10px] font-black text-text-muted uppercase">Pipeline Active</p>
            <p className="text-sm font-black text-text-main mt-1">{formatCurrency(pipelineValue)}</p>
          </div>
          <div className="p-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-[10px] font-black text-text-muted uppercase">ต้องปิด/วัน</p>
            <p className={`text-sm font-black mt-1 ${dailyNeeded > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {dailyNeeded > 0 ? formatCurrency(dailyNeeded) : '🎉 ถึงเป้า!'}
            </p>
          </div>
        </div>

        {/* Hot Deals */}
        {hotDeals.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
              <Zap size={10} style={{ color: member.color }} /> Hot Deals
            </p>
            <div className="space-y-2">
              {hotDeals.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => onDealClick && onDealClick(deal)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: stageColors[deal.stage] || '#6B7280' }} />
                    <div>
                      <p className="text-xs font-bold text-text-main truncate max-w-[120px]">{deal.title}</p>
                      <p className="text-[10px] text-text-muted">{deal.company}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black" style={{ color: member.color }}>{formatShort(deal.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-bold text-text-muted mb-1">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: member.color }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-1">{daysLeft} วันคงเหลือในเดือนนี้</p>
        </div>
      </div>
    </div>
  );
};

/* ── Main TeamDashboard ── */
const TeamDashboard = ({ deals = [], teamMembers = [], onDealClick, formatCurrency: fmt }) => {
  const fc = fmt || formatCurrency;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;

  // Team totals
  const teamGoal = teamMembers.reduce((s, m) => s + m.goal, 0);
  const teamWon = useMemo(() => {
    return deals
      .filter(d => d.stage === 'won' && new Date(d.updatedAt || d.createdAt) >= startOfMonth)
      .reduce((s, d) => s + (d.value || 0), 0);
  }, [deals]);

  const teamPipeline = deals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0);
  const teamGap = Math.max(0, teamGoal - teamWon);
  const teamPct = Math.min(100, teamGoal > 0 ? Math.round((teamWon / teamGoal) * 100) : 0);
  const teamDailyNeeded = daysLeft > 0 ? teamGap / daysLeft : 0;

  // Unassigned deals count
  const unassigned = deals.filter(d => !d.assigned_to && !['won', 'lost'].includes(d.stage)).length;

  // Leaderboard
  const leaderboard = teamMembers.map(m => {
    const wonRev = deals
      .filter(d => d.assigned_to === m.id && d.stage === 'won' && new Date(d.updatedAt || d.createdAt) >= startOfMonth)
      .reduce((s, d) => s + (d.value || 0), 0);
    return { ...m, wonRevenue: wonRev, pct: Math.round(Math.min(100, (wonRev / m.goal) * 100)) };
  }).sort((a, b) => b.wonRevenue - a.wonRevenue);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('th-TH', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const value = deals.filter(x => x.stage === 'won').reduce((s, x) => {
        const xd = new Date(x.updatedAt || x.createdAt);
        if (xd >= start && xd <= end) return s + (x.value || 0);
        return s;
      }, 0);
      months.push({ label, value });
    }
    return months;
  }, [deals]);

  const maxTrend = Math.max(...monthlyTrend.map(m => m.value), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">

      {/* ── TEAM HEADER ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Team Dashboard</h2>
              <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
                ภาพรวมทีมขาย • {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">ยอดทีม (Won)</p>
              <p className="text-2xl font-black">{formatShort(teamWon)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">เป้าทีม</p>
              <p className="text-2xl font-black text-yellow-300">{formatShort(teamGoal)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Pipeline รวม</p>
              <p className="text-2xl font-black text-cyan-300">{formatShort(teamPipeline)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Gap ที่เหลือ</p>
              <p className={`text-2xl font-black ${teamGap > 0 ? 'text-red-300' : 'text-green-300'}`}>
                {teamGap > 0 ? formatShort(teamGap) : '🎉 Done!'}
              </p>
            </div>
          </div>

          {/* Team Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-bold text-indigo-300 mb-2">
              <span>Team Progress</span>
              <span>{teamPct}% • ต้องปิดอีก {fc(teamDailyNeeded)}/วัน ({daysLeft} วัน)</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${teamPct}%`,
                  background: teamPct >= 80 ? 'linear-gradient(90deg,#22C55E,#86EFAC)' :
                    teamPct >= 50 ? 'linear-gradient(90deg,#EAB308,#FDE68A)' : 'linear-gradient(90deg,#F97316,#FED7AA)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {unassigned > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">มีดีล {unassigned} รายที่ยังไม่ได้มอบหมาย</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">ไปที่ Sales Pipeline แล้วแก้ไขดีลเพื่อระบุว่าเป็นของใคร</p>
          </div>
        </div>
      )}

      {/* ── MEMBER CARDS ── */}
      <div>
        <h3 className="text-sm font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <Star size={14} className="text-yellow-500" /> Individual Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              deals={deals}
              formatCurrency={fc}
              onDealClick={onDealClick}
            />
          ))}
        </div>
      </div>

      {/* ── LEADERBOARD + TREND ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm p-6">
          <h3 className="text-sm font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-yellow-500" /> Leaderboard (เดือนนี้)
          </h3>
          <div className="space-y-3">
            {leaderboard.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                  #{i + 1}
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: m.color }}>
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-main">{m.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                    </div>
                    <span className="text-[10px] font-bold text-text-muted">{m.pct}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-text-main">{formatShort(m.wonRevenue)}</p>
                  <p className="text-[10px] text-text-muted">/ {formatShort(m.goal)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm p-6">
          <h3 className="text-sm font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-green-500" /> ยอดปิด 6 เดือนย้อนหลัง (ทีมรวม)
          </h3>
          <div className="flex items-end gap-2 h-40">
            {monthlyTrend.map((m, i) => {
              const h = Math.round((m.value / maxTrend) * 100);
              const isCurrentMonth = i === 5;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[9px] font-bold text-text-muted">{m.value > 0 ? formatShort(m.value) : '-'}</p>
                  <div className="w-full rounded-t-xl transition-all duration-700 relative overflow-hidden" style={{ height: `${Math.max(h, 4)}%`, minHeight: 6 }}>
                    <div className={`absolute inset-0 ${isCurrentMonth ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    {isCurrentMonth && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                  </div>
                  <p className={`text-[9px] font-black uppercase ${isCurrentMonth ? 'text-accent' : 'text-text-muted'}`}>{m.label}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-accent" />
            <p className="text-[10px] text-text-muted font-bold">เดือนปัจจุบัน • เป้าทีม {fc(teamGoal)}</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TeamDashboard;
