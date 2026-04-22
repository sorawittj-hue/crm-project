// src/pages/AnalyticsPage.jsx
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';

const MONTH_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const THB = (n) => n>=1_000_000 ? (n/1_000_000).toFixed(1)+'M' : Math.round(n/1000)+'K';

export default function AnalyticsPage() {
  const { data: deals = [] } = useDeals();
  const { data: settings } = useSettings();
  const target = settings?.monthly_target || 7_000_000;

  const monthly = useMemo(() => {
    const now = new Date();
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const won = deals.filter(x =>
        x.stage === 'won' &&
        new Date(x.created_at).getMonth() === d.getMonth() &&
        new Date(x.created_at).getFullYear() === d.getFullYear()
      ).reduce((s, x) => s + Number(x.value || 0), 0);
      arr.push({ month: MONTH_TH[d.getMonth()], value: won / 1_000_000 });
    }
    return arr;
  }, [deals]);

  const byStage = useMemo(() => {
    const stages = ['lead','qualified','proposal','negotiation','won'];
    const labels = { lead:'ใหม่', qualified:'คุยแล้ว', proposal:'เสนอ', negotiation:'ต่อรอง', won:'ปิด' };
    const colors = ['#BEE4FF','#DCCCFF','#FFD4A8','#FFCFE1','#B8F2D8'];
    return stages.map((s, i) => ({
      name: labels[s],
      value: deals.filter(d => d.stage === s).reduce((a,b)=>a+Number(b.value||0),0),
      color: colors[i]
    }));
  }, [deals]);

  const total = byStage.reduce((s,x)=>s+x.value, 0);
  const wonValue = byStage[4].value;
  const conversionRate = total > 0 ? Math.round(wonValue / total * 100) : 0;

  return (
    <div className="page-analytics">
      <div className="card">
        <div className="card-header"><div className="card-title">📊 ยอดขายรายเดือน (6 เดือนล่าสุด)</div></div>
        <div style={{height:280}}>
          <ResponsiveContainer>
            <BarChart data={monthly}>
              <XAxis dataKey="month" tick={{fill:'var(--ink-600)', fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'var(--ink-600)', fontSize:12}} axisLine={false} tickLine={false} tickFormatter={(v)=>v+'M'}/>
              <Tooltip contentStyle={{borderRadius:12,border:'1px solid var(--zborder)',background:'white'}} formatter={(v)=>[v.toFixed(2)+'M ฿','ยอดขาย']}/>
              <ReferenceLine y={target/1_000_000} stroke="var(--pink-400)" strokeDasharray="4 4" label={{value:`เป้า ${(target/1_000_000).toFixed(1)}M`, fill:'var(--pink-500)', fontSize:11}}/>
              <Bar dataKey="value" fill="url(#g1)" radius={[12,12,0,0]}/>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--lav-300)"/>
                  <stop offset="100%" stopColor="var(--pink-300)"/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ana-row">
        <div className="card">
          <div className="card-header"><div className="card-title">🍩 มูลค่าตามสถานะ</div></div>
          <div style={{height:240}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStage} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {byStage.map((s,i)=><Cell key={i} fill={s.color}/>)}
                </Pie>
                <Tooltip formatter={(v)=>THB(v)+' ฿'}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {byStage.map(s => <div key={s.name} className="legend-item"><span className="legend-dot" style={{background:s.color}}/>{s.name} · {THB(s.value)}</div>)}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">🎯 Conversion Funnel</div></div>
          <div className="funnel">
            {byStage.map((s, i) => {
              const pct = total > 0 ? (s.value / total * 100) : 0;
              return (
                <div key={s.name} className="funnel-row" style={{width:`${Math.max(30, pct*2+30)}%`,background:s.color}}>
                  <span className="funnel-name">{s.name}</span>
                  <span className="funnel-val">{THB(s.value)} ฿ · {pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
          <div className="funnel-foot">อัตราปิดดีลโดยรวม: <b>{conversionRate}%</b></div>
        </div>
      </div>
    </div>
  );
}
