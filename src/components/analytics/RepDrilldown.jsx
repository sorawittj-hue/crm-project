import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, TrendingUp, Briefcase, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';
import { STAGE_LABELS } from '../../lib/constants';

const STAGE_COLOR = {
  lead: 'bg-slate-100 text-slate-700',
  contact: 'bg-amber-100 text-amber-700',
  proposal: 'bg-sky-100 text-sky-700',
  negotiation: 'bg-violet-100 text-violet-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
};

export default function RepDrilldown({ member, deals = [], monthlyTarget = 0, onClose }) {
  const stats = useMemo(() => {
    if (!member) return null;
    const repDeals = deals.filter(d => d.assigned_to === member.id || d.assigned_to === member.user_id);
    const wonDeals = repDeals.filter(d => d.stage === 'won');
    const lostDeals = repDeals.filter(d => d.stage === 'lost');
    const activeDeals = repDeals.filter(d => !['won', 'lost'].includes(d.stage));
    const wonValue = wonDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const pipelineValue = activeDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;
    const avgDealSize = wonDeals.length > 0 ? Math.round(wonValue / wonDeals.length) : 0;
    const goalPct = monthlyTarget > 0 ? Math.round((wonValue / monthlyTarget) * 100) : 0;
    return { repDeals, wonDeals, activeDeals, wonValue, pipelineValue, winRate, avgDealSize, goalPct };
  }, [member, deals, monthlyTarget]);

  if (!member || !stats) return null;

  const avatarLetter = (member.name || member.full_name || '?')[0].toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-700">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 to-indigo-800/90" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl font-black text-white">
                {avatarLetter}
              </div>
              <div>
                <p className="text-xs text-white/70 font-bold uppercase tracking-widest">Sales Rep Performance</p>
                <h2 className="text-xl font-black text-white">{member.name || member.full_name}</h2>
                <p className="text-sm text-white/70">{member.role || 'Sales'}</p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100">
            {[
              { label: 'Won Value', value: formatCurrency(stats.wonValue), icon: Trophy, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Win Rate', value: `${stats.winRate}%`, icon: Target, color: 'text-violet-600 bg-violet-50' },
              { label: 'Avg Deal Size', value: formatCurrency(stats.avgDealSize), icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
              { label: 'Goal %', value: `${stats.goalPct}%`, icon: TrendingUp, color: stats.goalPct >= 100 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-slate-50/80 rounded-2xl p-3">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', color)}>
                  <Icon size={14} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-lg font-black text-slate-900 leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Deals List */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">ดีลทั้งหมด ({stats.repDeals.length})</p>
            <div className="space-y-2">
              {stats.repDeals.slice(0, 20).map(deal => (
                <div key={deal.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{deal.title}</p>
                    <p className="text-xs text-slate-400">{deal.company}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(deal.value)}</p>
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', STAGE_COLOR[deal.stage] || 'bg-slate-100 text-slate-600')}>
                      {STAGE_LABELS?.[deal.stage] || deal.stage}
                    </span>
                  </div>
                </div>
              ))}
              {stats.repDeals.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">ยังไม่มีดีล</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
