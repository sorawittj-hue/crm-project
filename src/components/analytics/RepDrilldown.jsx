import { useMemo } from 'react';
import { Trophy, Target, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';
import { STAGE_LABELS } from '../../lib/constants';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/Dialog';

const STAGE_COLOR = {
  lead: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  contact: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  proposal: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  negotiation: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  lost: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
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
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose?.(); }} className="max-w-2xl">
      <DialogContent showCloseButton={false} className="flex max-h-[85dvh] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-0 shadow-2xl dark:border-white/10 dark:bg-[#0f111a]/95">
          {/* Header */}
          <div className="relative p-6 border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-violet-600 to-indigo-700">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 to-indigo-800/90" />
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดรายละเอียดทีมขาย"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl font-black text-white">
                {avatarLetter}
              </div>
              <div>
                <p className="text-xs text-white/70 font-bold uppercase tracking-widest">Sales Rep Performance</p>
                <DialogTitle className="text-xl font-bold text-white">{member.name || member.full_name}</DialogTitle>
                <DialogDescription className="sr-only">ผลการขายและดีลทั้งหมดของสมาชิกทีมนี้</DialogDescription>
                <p className="text-sm text-white/70">{member.role || 'Sales'}</p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100 dark:border-white/10">
            {[
              { label: 'Won Value', value: formatCurrency(stats.wonValue), icon: Trophy, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
              { label: 'Win Rate', value: `${stats.winRate}%`, icon: Target, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' },
              { label: 'Avg Deal Size', value: formatCurrency(stats.avgDealSize), icon: DollarSign, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' },
              { label: 'Goal %', value: `${stats.goalPct}%`, icon: TrendingUp, color: stats.goalPct >= 100 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-3">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', color)}>
                  <Icon size={14} />
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Deals List */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">ดีลทั้งหมด ({stats.repDeals.length})</p>
            <div className="space-y-2">
              {stats.repDeals.slice(0, 20).map(deal => (
                <div key={deal.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{deal.title}</p>
                    <p className="text-xs text-slate-400">{deal.company}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(deal.value)}</p>
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', STAGE_COLOR[deal.stage] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>
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
      </DialogContent>
    </Dialog>
  );
}
