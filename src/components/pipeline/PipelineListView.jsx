import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, TrendingUp, Calendar, Building2 } from 'lucide-react';

export default function PipelineListView({ deals, onUpdateDeal, onDeleteDeal }) {
  const stageLabels = {
    lead: 'ลูกค้าใหม่',
    contact: 'นัดเจอ',
    proposal: 'เสนอราคา',
    negotiation: 'กำลังปิด',
    won: 'ปิดได้',
    lost: 'ปิดไม่ได้'
  };

  const stageColors = {
    lead: 'bg-slate-100 text-slate-700',
    contact: 'bg-amber-100 text-amber-700',
    proposal: 'bg-sky-100 text-sky-700',
    negotiation: 'bg-violet-100 text-violet-700',
    won: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-rose-100 text-rose-700'
  };

  if (!deals || deals.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <p className="text-slate-500">ไม่มีดีลให้แสดง</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 border-b border-slate-200/60">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Title</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Company</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Value</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Stage</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Probability</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Expected Close Date</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deals.map((deal) => (
              <motion.tr 
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{deal.title || 'Untitled'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Building2 size={14} className="text-slate-400" />
                    {deal.company || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-black text-emerald-600 tabular-nums">
                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(deal.value) || 0)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${stageColors[deal.stage] || stageColors.lead}`}>
                    {stageLabels[deal.stage] || deal.stage}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <TrendingUp size={14} className={Number(deal.probability) >= 70 ? 'text-emerald-500' : 'text-slate-400'} />
                    {deal.probability || 0}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Calendar size={14} className="text-slate-400" />
                    {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('th-TH') : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this deal?')) {
                        onDeleteDeal(deal.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
