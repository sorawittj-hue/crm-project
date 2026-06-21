import { useMemo, useState } from 'react';
import { getUpcomingRenewals } from '../../utils/salesIntelligence';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';
import { Calendar, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function RenewalsBoard({ deals, customers, onDealClick }) {
  const [now] = useState(() => Date.now());
  const renewals = useMemo(() => {
    return getUpcomingRenewals(deals, customers, new Date(), 90);
  }, [deals, customers]);

  if (!renewals || renewals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">ไม่มีดีลที่ต้องต่ออายุเร็วๆ นี้</h3>
        <p className="text-sm text-slate-500 mt-1">ดีลที่ต้องต่ออายุใน 90 วันจะปรากฏที่นี่</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {renewals.map(deal => {
        const renewalDate = new Date(deal.renewal_date);
        const daysLeft = Math.ceil((renewalDate.getTime() - now) / 86400000);
        
        let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
        let StatusIcon = CheckCircle;
        
        if (daysLeft <= 30) {
          statusColor = "bg-rose-50 text-rose-700 border-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
          StatusIcon = ShieldAlert;
        } else if (daysLeft <= 60) {
          statusColor = "bg-amber-50 text-amber-700 border-amber-100";
          StatusIcon = AlertTriangle;
        }

        return (
          <Card key={deal.id} className="p-5 flex flex-col group hover:shadow-xl transition-all duration-300 border-slate-200/60 rounded-2xl cursor-pointer" onClick={() => onDealClick && onDealClick(deal)}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border", statusColor)}>
                <StatusIcon size={12} strokeWidth={3} />
                เหลือ {daysLeft} วัน
              </div>
              <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                {deal.customerHealthGrade} Grade
              </div>
            </div>
            
            <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-violet-600 transition-colors">{deal.title || deal.company}</h4>
            <p className="text-xs text-slate-500 font-medium mb-4">{deal.company}</p>
            
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">มูลค่าต่ออายุ</p>
                <p className="text-sm font-black text-slate-900">{formatCurrency(deal.value)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">วันครบกำหนด</p>
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  {renewalDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
