import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3 } from 'lucide-react';

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '฿0';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0
  }).format(amount);
};

const getMonthName = (year, month) => {
  return new Date(year, month).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
};

const MonthlyComparison = ({ deals, currentDate }) => {
  const comparison = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Get current month deals
    const currentMonthDeals = deals.filter(d => {
      const date = new Date(d.createdAt);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });
    
    // Get previous month deals
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthDeals = deals.filter(d => {
      const date = new Date(d.createdAt);
      return date.getFullYear() === prevDate.getFullYear() && 
             date.getMonth() === prevDate.getMonth();
    });
    
    // Calculate stats for current month
    const currentWon = currentMonthDeals.filter(d => d.stage === 'won');
    const currentWonValue = currentWon.reduce((sum, d) => sum + (d.value || 0), 0);
    const currentTotal = currentMonthDeals.length;
    const currentAvgValue = currentTotal > 0 
      ? currentMonthDeals.reduce((sum, d) => sum + (d.value || 0), 0) / currentTotal 
      : 0;
    
    // Calculate stats for previous month
    const prevWon = prevMonthDeals.filter(d => d.stage === 'won');
    const prevWonValue = prevWon.reduce((sum, d) => sum + (d.value || 0), 0);
    const prevTotal = prevMonthDeals.length;
    const prevAvgValue = prevTotal > 0 
      ? prevMonthDeals.reduce((sum, d) => sum + (d.value || 0), 0) / prevTotal 
      : 0;
    
    // Calculate changes
    const wonValueChange = prevWonValue > 0 ? ((currentWonValue - prevWonValue) / prevWonValue) * 100 : 0;
    const dealCountChange = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    const avgValueChange = prevAvgValue > 0 ? ((currentAvgValue - prevAvgValue) / prevAvgValue) * 100 : 0;
    
    return {
      current: {
        month: getMonthName(currentYear, currentMonth),
        wonValue: currentWonValue,
        totalDeals: currentTotal,
        wonDeals: currentWon.length,
        avgValue: currentAvgValue
      },
      previous: {
        month: getMonthName(prevDate.getFullYear(), prevDate.getMonth()),
        wonValue: prevWonValue,
        totalDeals: prevTotal,
        wonDeals: prevWon.length,
        avgValue: prevAvgValue
      },
      changes: {
        wonValue: wonValueChange,
        dealCount: dealCountChange,
        avgValue: avgValueChange
      }
    };
  }, [deals, currentDate]);

  const ChangeIndicator = ({ value, suffix = '%' }) => {
    if (value === 0) {
      return (
        <span className="flex items-center gap-1 text-gray-500">
          <Minus size={14} />
          <span className="text-xs">เท่ากัน</span>
        </span>
      );
    }
    
    const isPositive = value > 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span className="text-sm font-semibold">{Math.abs(value).toFixed(1)}{suffix}</span>
        <span className="text-xs text-gray-500">vs เดือนที่แล้ว</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">เปรียบเทียบรายเดือน</h3>
            <p className="text-sm text-gray-500">{comparison.previous.month} → {comparison.current.month}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Won Revenue */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">ยอดขายสำเร็จ</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">
              {formatCurrency(comparison.current.wonValue)}
            </span>
          </div>
          <ChangeIndicator value={comparison.changes.wonValue} />
          <p className="text-xs text-gray-400">
            {comparison.previous.month}: {formatCurrency(comparison.previous.wonValue)}
          </p>
        </div>

        {/* Deal Count */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">จำนวนดีล</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">
              {comparison.current.totalDeals}
            </span>
            <span className="text-sm text-gray-500">ดีล</span>
          </div>
          <ChangeIndicator value={comparison.changes.dealCount} />
          <p className="text-xs text-gray-400">
            {comparison.previous.month}: {comparison.previous.totalDeals} ดีล
          </p>
        </div>

        {/* Average Deal Value */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">มูลค่าเฉลี่ยต่อดีล</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">
              {formatCurrency(comparison.current.avgValue)}
            </span>
          </div>
          <ChangeIndicator value={comparison.changes.avgValue} />
          <p className="text-xs text-gray-400">
            {comparison.previous.month}: {formatCurrency(comparison.previous.avgValue)}
          </p>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-end gap-2 h-16">
          {[
            { label: comparison.previous.month, value: comparison.previous.wonValue },
            { label: comparison.current.month, value: comparison.current.wonValue }
          ].map((item, idx) => {
            const max = Math.max(comparison.previous.wonValue, comparison.current.wonValue) || 1;
            const height = (item.value / max) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t-lg transition-all ${
                    idx === 1 ? 'bg-gradient-to-t from-blue-500 to-blue-400' : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className="text-[10px] text-gray-400">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparison;
