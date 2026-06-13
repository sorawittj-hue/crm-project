import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell
} from 'recharts';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import { buildPipelineIntelligence } from '../utils/salesIntelligence';
import { 
  BadgeDollarSign, TrendingUp, Target, Save, Loader2, Calendar, 
  BarChart3, Plus, ArrowUpRight, ArrowDownRight, Edit2
} from 'lucide-react';
import { useDeals } from '../hooks/useDeals';
import { useMonthlySales, useUpsertMonthlySale } from '../hooks/useSales';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../lib/formatters';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const MONTHS = [
  { value: 1, label: 'ม.ค.', full: 'มกราคม' },
  { value: 2, label: 'ก.พ.', full: 'กุมภาพันธ์' },
  { value: 3, label: 'มี.ค.', full: 'มีนาคม' },
  { value: 4, label: 'เม.ย.', full: 'เมษายน' },
  { value: 5, label: 'พ.ค.', full: 'พฤษภาคม' },
  { value: 6, label: 'มิ.ย.', full: 'มิถุนายน' },
  { value: 7, label: 'ก.ค.', full: 'กรกฎาคม' },
  { value: 8, label: 'ส.ค.', full: 'สิงหาคม' },
  { value: 9, label: 'ก.ย.', full: 'กันยายน' },
  { value: 10, label: 'ต.ค.', full: 'ตุลาคม' },
  { value: 11, label: 'พ.ย.', full: 'พฤศจิกายน' },
  { value: 12, label: 'ธ.ค.', full: 'ธันวาคม' },
];

const pageMotion = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex flex-col gap-1 z-50">
        <p className="text-sm font-bold text-slate-800">{data.fullMonth} {data.year}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.isCurrentMonth ? 'ยอดปิดดีลจริง' : 'ยอดที่บันทึก'}</p>
        <p className="text-lg font-black text-violet-600 mt-1">{formatCurrency(data.amount)}</p>
      </div>
    );
  }
  return null;
};

export default function SalesTrackingPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { monthlyTarget } = useAppStore();
  const annualTarget = monthlyTarget * 12;

  const { data: deals = [], isLoading: loadingDeals } = useDeals();
  const { data: dbSales = [], isLoading: loadingSales } = useMonthlySales(currentYear);
  const upsertSale = useUpsertMonthlySale();

  const [editValues, setEditValues] = useState({});
  const [editingMonth, setEditingMonth] = useState(null);
  const [showChart, setShowChart] = useState(false);

  // Delay heavy chart rendering until page transition finishes (fixes lag and data redraw bugs)
  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 350);
    return () => clearTimeout(timer);
  }, []);

  // Calculate won deals for current month
  const currentMonthPipelineSales = useMemo(() => {
    const intelligence = buildPipelineIntelligence(deals, { monthlyGoal: monthlyTarget, now: new Date() });
    return intelligence.currentMonthWonValue;
  }, [deals, monthlyTarget]);

  // Merge DB manual sales with Pipeline live sales
  const mergedSalesData = useMemo(() => {
    const data = [];
    let cumulative = 0;
    
    for (const m of MONTHS) {
      const isCurrentMonth = m.value === currentMonth;
      let amount = 0;
      
      if (isCurrentMonth) {
        amount = currentMonthPipelineSales;
      } else {
        const dbRecord = dbSales.find(s => s.month === m.value);
        amount = dbRecord ? Number(dbRecord.amount) : 0;
      }
      
      cumulative += amount;
      data.push({
        month: m.value,
        shortMonth: m.label,
        fullMonth: m.full,
        year: currentYear,
        amount,
        cumulative,
        isCurrentMonth
      });
    }
    return data;
  }, [dbSales, currentMonthPipelineSales, currentMonth, currentYear]);

  const totalYearlySales = mergedSalesData[mergedSalesData.length - 1].cumulative;
  const annualProgress = annualTarget > 0 ? Math.min(100, Math.round((totalYearlySales / annualTarget) * 100)) : 0;

  const quarterlySales = useMemo(() => {
    const q1 = mergedSalesData.slice(0, 3).reduce((sum, item) => sum + item.amount, 0);
    const q2 = mergedSalesData.slice(3, 6).reduce((sum, item) => sum + item.amount, 0);
    const q3 = mergedSalesData.slice(6, 9).reduce((sum, item) => sum + item.amount, 0);
    const q4 = mergedSalesData.slice(9, 12).reduce((sum, item) => sum + item.amount, 0);
    return [
      { id: 'Q1', label: 'ไตรมาส 1 (ม.ค. - มี.ค.)', amount: q1 },
      { id: 'Q2', label: 'ไตรมาส 2 (เม.ย. - มิ.ย.)', amount: q2 },
      { id: 'Q3', label: 'ไตรมาส 3 (ก.ค. - ก.ย.)', amount: q3 },
      { id: 'Q4', label: 'ไตรมาส 4 (ต.ค. - ธ.ค.)', amount: q4 },
    ];
  }, [mergedSalesData]);

  const handleEditChange = (month, value) => {
    // Remove non-numeric characters except dot
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setEditValues(prev => ({ ...prev, [month]: cleanValue }));
  };

  const handleSave = async (month) => {
    const value = editValues[month];
    if (value !== undefined) {
      const amount = Number(value) || 0;
      await upsertSale.mutateAsync({ year: currentYear, month, amount });
    }
    setEditingMonth(null);
  };

  // No blocking loader, let the page render immediately.
  // React Query will seamlessly update the UI when data arrives.

  return (
    <motion.div {...pageMotion} className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <BadgeDollarSign size={20} strokeWidth={2.5} />
            </div>
            ยอดขายปี {currentYear}
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">ติดตามเป้าหมายรายเดือนและรวมทั้งปี</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-violet-100/50 to-indigo-100/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <BarChart3 size={16} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ยอดขายรวมทั้งปี</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalYearlySales)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
            <TrendingUp size={14} />
            เทียบกับเป้าหมายรายปี
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar size={16} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">เดือนปัจจุบัน ({MONTHS[currentMonth-1].full})</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(currentMonthPipelineSales)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
            ดึงข้อมูลอัตโนมัติจากดีลที่ชนะใน Pipeline
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-violet-500/20 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-violet-200" />
              <span className="text-xs font-bold text-violet-200 uppercase tracking-widest">ความสำเร็จ (Annual Goal)</span>
            </div>
            <h3 className="text-3xl font-black tracking-tight flex items-baseline gap-2">
              {annualProgress}%
              <span className="text-sm font-semibold text-violet-300">ของเป้าหมาย</span>
            </h3>
          </div>
          <div className="relative z-10 mt-6 h-3 bg-black/20 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${annualProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            />
          </div>
          <p className="relative z-10 text-[10px] text-violet-200 font-medium mt-2 text-right">
            เป้าหมายรายปี: {formatCurrency(annualTarget)}
          </p>
        </div>
      </div>

      {/* Quarterly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quarterlySales.map(q => {
          const currentQ = Math.floor((currentMonth - 1) / 3) + 1;
          const isCurrentQ = q.id === `Q${currentQ}`;
          return (
            <div key={q.id} className={cn(
              "p-4 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border flex flex-col justify-center relative overflow-hidden transition-all",
              isCurrentQ ? "bg-violet-50/50 border-violet-100" : "bg-white border-slate-100"
            )}>
              {isCurrentQ && <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full -mr-8 -mt-8 blur-xl" />}
              <div className="flex items-center justify-between mb-1 relative z-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{q.label}</span>
                {isCurrentQ && <span className="text-[10px] font-black bg-violet-600 text-white px-1.5 py-0.5 rounded-md">NOW</span>}
              </div>
              <h4 className={cn("text-xl font-black tracking-tight relative z-10", isCurrentQ ? "text-violet-700" : "text-slate-800")}>
                {formatCurrency(q.amount)}
              </h4>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Chart Area */}
        <div className="xl:col-span-8 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">เทรนด์ยอดขายรายเดือน</h3>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-violet-600" /> อดีต/บันทึกเอง</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-emerald-400" /> เดือนปัจจุบัน (Live)</div>
            </div>
          </div>
          <div className="h-[380px] w-full min-w-0">
            {showChart ? (
              <SafeResponsiveContainer width="100%" height="100%">
                <BarChart data={mergedSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="shortMonth" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    tickFormatter={(val) => `${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="amount" radius={[6, 6, 6, 6]} maxBarSize={40} isAnimationActive={false}>
                    {mergedSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isCurrentMonth ? "url(#colorCurrent)" : "url(#colorSales)"} />
                    ))}
                  </Bar>
                </BarChart>
              </SafeResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                <Loader2 className="w-6 h-6 text-violet-300 animate-spin mb-2" />
                <p className="text-xs font-semibold text-slate-400">กำลังโหลดกราฟข้อมูล...</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Table Area */}
        <div className="xl:col-span-4 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">บันทึกยอดขาย (Manual Entry)</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {mergedSalesData.map((data) => {
              const isEditing = editingMonth === data.month;
              
              return (
                <div 
                  key={data.month} 
                  className={cn(
                    "p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between",
                    data.isCurrentMonth ? "bg-emerald-50/50 border-emerald-100" : 
                    isEditing ? "bg-violet-50 border-violet-200 ring-2 ring-violet-100" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black",
                      data.isCurrentMonth ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 shadow-sm"
                    )}>
                      {data.shortMonth}
                    </div>
                    {data.isCurrentMonth ? (
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">เดือนปัจจุบัน (Auto)</p>
                        <p className="text-sm font-black text-slate-800">{formatCurrency(data.amount)}</p>
                      </div>
                    ) : isEditing ? (
                      <div className="relative">
                        <Input
                          autoFocus
                          value={editValues[data.month] !== undefined ? editValues[data.month] : data.amount}
                          onChange={(e) => handleEditChange(data.month, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(data.month);
                            if (e.key === 'Escape') setEditingMonth(null);
                          }}
                          className="h-8 text-sm font-bold w-28 pl-2 pr-2"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{data.fullMonth}</p>
                        <p className="text-sm font-black text-slate-800">{formatCurrency(data.amount)}</p>
                      </div>
                    )}
                  </div>

                  {!data.isCurrentMonth && (
                    isEditing ? (
                      <Button 
                        size="icon" 
                        className="h-8 w-8 bg-violet-600 hover:bg-violet-700 rounded-xl"
                        onClick={() => handleSave(data.month)}
                        disabled={upsertSale.isPending}
                      >
                        {upsertSale.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      </Button>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditValues({ ...editValues, [data.month]: data.amount });
                          setEditingMonth(data.month);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
