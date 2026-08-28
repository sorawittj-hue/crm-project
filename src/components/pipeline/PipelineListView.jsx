import { motion } from 'framer-motion';
import { Trash2, TrendingUp, Calendar, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function PipelineListView({ deals, onDeleteDeal, onDealClick }) {
  const stageLabels = {
    lead: 'ลูกค้าใหม่',
    contact: 'นัดเจอ',
    proposal: 'เสนอราคา',
    negotiation: 'กำลังปิด',
    won: 'ปิดได้',
    lost: 'ปิดไม่ได้'
  };

  const stageColors = {
    lead: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10',
    contact: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    proposal: 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
    negotiation: 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40',
    won: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    lost: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
  };

  if (!deals || deals.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/10">
        <p className="text-slate-500 dark:text-slate-400 font-medium">ไม่มีดีลให้แสดง</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Title</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Company</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Value</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Stage</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Probability</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Expected Close Date</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {deals.map((deal) => (
              <motion.tr 
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                tabIndex={0}
                role="button"
                aria-label={`เปิดดีล ${deal.title || deal.company || 'ไม่ระบุชื่อ'}`}
                onClick={() => onDealClick?.(deal)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onDealClick?.(deal);
                  }
                }}
                className="cursor-pointer hover:bg-violet-50/50 dark:hover:bg-white/[0.04] focus-within:bg-violet-50/50 dark:focus-within:bg-white/[0.04] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 dark:text-white">{deal.title || 'Untitled'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <Building2 size={14} className="text-slate-400" />
                    {deal.company || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(deal.value) || 0)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border", stageColors[deal.stage] || stageColors.lead)}>
                    {stageLabels[deal.stage] || deal.stage}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                    <TrendingUp size={14} className={Number(deal.probability) >= 70 ? 'text-emerald-500' : 'text-slate-400'} />
                    {deal.probability || 0}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <Calendar size={14} className="text-slate-400" />
                    {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('th-TH') : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this deal?')) {
                        onDeleteDeal(deal.id);
                      }
                    }}
                    aria-label={`ลบดีล ${deal.title || deal.company || ''}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
