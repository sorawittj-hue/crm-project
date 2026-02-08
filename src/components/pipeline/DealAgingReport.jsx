import { useMemo } from 'react';
import { Clock, AlertTriangle, Zap, CheckCircle2, Timer } from 'lucide-react';

const DealAgingReport = ({ deals }) => {
  const agingStats = useMemo(() => {
    const now = new Date();
    
    const stats = {
      fresh: [],      // 0-3 days
      recent: [],     // 4-7 days
      aging: [],      // 8-14 days
      stale: [],      // 15-30 days
      danger: []      // 30+ days
    };
    
    deals.forEach(deal => {
      if (deal.stage === 'won' || deal.stage === 'lost') return;
      
      const lastActivity = deal.lastActivity ? new Date(deal.lastActivity) : new Date(deal.createdAt);
      const daysSince = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (daysSince <= 3) stats.fresh.push({ ...deal, daysSince });
      else if (daysSince <= 7) stats.recent.push({ ...deal, daysSince });
      else if (daysSince <= 14) stats.aging.push({ ...deal, daysSince });
      else if (daysSince <= 30) stats.stale.push({ ...deal, daysSince });
      else stats.danger.push({ ...deal, daysSince });
    });
    
    return stats;
  }, [deals]);

  const categories = [
    { 
      key: 'fresh', 
      label: 'สดใหม่', 
      desc: '0-3 วัน',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      icon: CheckCircle2
    },
    { 
      key: 'recent', 
      label: 'ปกติ', 
      desc: '4-7 วัน',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      barColor: 'bg-blue-500',
      icon: Clock
    },
    { 
      key: 'aging', 
      label: 'เริ่มเก่า', 
      desc: '8-14 วัน',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      barColor: 'bg-amber-500',
      icon: Timer
    },
    { 
      key: 'stale', 
      label: 'เก่า', 
      desc: '15-30 วัน',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      barColor: 'bg-orange-500',
      icon: AlertTriangle
    },
    { 
      key: 'danger', 
      label: 'เสี่ยงหลุด', 
      desc: '30+ วัน',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      barColor: 'bg-rose-500',
      icon: Zap
    },
  ];

  const totalActive = Object.values(agingStats).flat().length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Timer size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Deal Aging Report</h3>
            <p className="text-sm text-gray-500">วิเคราะห์ความเก่าของดีลที่กำลังเจรจา</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">{totalActive}</p>
          <p className="text-xs text-gray-500">ดีลที่กำลังเจรจา</p>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map(cat => {
          const deals = agingStats[cat.key];
          const count = deals.length;
          const percentage = totalActive > 0 ? (count / totalActive) * 100 : 0;
          const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
          const Icon = cat.icon;
          
          return (
            <div key={cat.key} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{count} ดีล</p>
                  <p className="text-xs text-gray-500">
                    {totalValue > 0 ? new Intl.NumberFormat('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                      maximumFractionDigits: 0
                    }).format(totalValue) : '฿0'}
                  </p>
                </div>
              </div>
              
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${cat.barColor} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Deal List (show top 3) */}
              {deals.length > 0 && (
                <div className="mt-2 space-y-1 max-h-0 group-hover:max-h-32 overflow-hidden transition-all">
                  {deals.slice(0, 3).map(deal => (
                    <div key={deal.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
                      <span className="truncate flex-1">{deal.title}</span>
                      <span className="text-xs text-gray-500 ml-2">{deal.daysSince} วัน</span>
                    </div>
                  ))}
                  {deals.length > 3 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      +{deals.length - 3} ดีลอื่น
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Alert */}
      {agingStats.danger.length > 0 && (
        <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-800">⚠️ ต้องการการดำเนินการ!</p>
              <p className="text-sm text-rose-700 mt-1">
                มี {agingStats.danger.length} ดีลที่เงียบหายไปเกิน 30 วัน 
                มูลค่ารวม {new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                  maximumFractionDigits: 0
                }).format(agingStats.danger.reduce((sum, d) => sum + (d.value || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealAgingReport;
