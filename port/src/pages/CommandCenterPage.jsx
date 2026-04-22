// src/pages/CommandCenterPage.jsx
// Dashboard หน้าแรก — ใช้ useDeals, useCustomers, useTeam จาก Supabase

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Target, Users, Flame, Clock } from 'lucide-react';
import { useDeals } from '../hooks/useDeals';
import { useCustomers } from '../hooks/useCustomers';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';

const THB = (n) => {
  if (!n) return '0 ฿';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M ฿';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K ฿';
  return Math.round(n) + ' ฿';
};

const daysAgo = (iso) => {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 1) return 'วันนี้';
  if (diff < 2) return 'เมื่อวาน';
  return `${Math.floor(diff)} วันก่อน`;
};

export default function CommandCenterPage() {
  const nav = useNavigate();
  const { data: deals = [] } = useDeals();
  const { data: customers = [] } = useCustomers();
  const { data: team = [] } = useTeam();
  const { data: settings } = useSettings();

  const stats = useMemo(() => {
    const open = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
    const pipeline = open.reduce((s, d) => s + Number(d.value || 0), 0);
    const wonMonth = deals.filter(d => {
      if (d.stage !== 'won') return false;
      const dt = new Date(d.created_at);
      const now = new Date();
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).reduce((s, d) => s + Number(d.value || 0), 0);
    const hot = open.filter(d => (d.tags || []).includes('hot')).length;
    return { pipeline, wonMonth, hot, customers: customers.length };
  }, [deals, customers]);

  const hotDeals = useMemo(() =>
    deals
      .filter(d => (d.tags || []).includes('hot') && d.stage !== 'won' && d.stage !== 'lost')
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 4)
  , [deals]);

  const target = settings?.monthly_target || 7_000_000;

  return (
    <div className="page-grid">
      {/* Greeting */}
      <section className="greeting-card">
        <div className="greeting-left">
          <div className="greeting-emoji">🌸</div>
          <div>
            <div className="greeting-title">สวัสดีตอนเช้า, คุณ!</div>
            <div className="greeting-sub">วันนี้มีงานน่าตื่นเต้นรออยู่ ✨</div>
          </div>
        </div>
        <div className="greeting-stats">
          <div className="greeting-stat"><div className="gs-value">{deals.filter(d=>d.stage!=='won'&&d.stage!=='lost').length}</div><div className="gs-label">ดีลที่เปิดอยู่</div></div>
          <div className="greeting-stat"><div className="gs-value">{stats.hot}</div><div className="gs-label">ดีลด่วน 🔥</div></div>
        </div>
      </section>

      {/* KPI */}
      <section className="kpi-row">
        <div className="kpi-card" style={{background:'linear-gradient(135deg,var(--pink-50),var(--pink-100))'}}>
          <div className="kpi-icon" style={{background:'var(--pink-200)'}}><TrendingUp size={20}/></div>
          <div className="kpi-label">Pipeline รวม</div>
          <div className="kpi-value">{THB(stats.pipeline)}</div>
        </div>
        <div className="kpi-card" style={{background:'linear-gradient(135deg,var(--mint-50),var(--mint-100))'}}>
          <div className="kpi-icon" style={{background:'var(--mint-200)'}}><Target size={20}/></div>
          <div className="kpi-label">ปิดได้เดือนนี้</div>
          <div className="kpi-value">{THB(stats.wonMonth)}</div>
          <div className="kpi-foot">{Math.round(stats.wonMonth / target * 100)}% ของเป้า</div>
        </div>
        <div className="kpi-card" style={{background:'linear-gradient(135deg,var(--peach-50),var(--peach-100))'}}>
          <div className="kpi-icon" style={{background:'var(--peach-200)'}}><Flame size={20}/></div>
          <div className="kpi-label">ดีลด่วน</div>
          <div className="kpi-value">{stats.hot}</div>
        </div>
        <div className="kpi-card" style={{background:'linear-gradient(135deg,var(--lav-50),var(--lav-100))'}}>
          <div className="kpi-icon" style={{background:'var(--lav-200)'}}><Users size={20}/></div>
          <div className="kpi-label">ลูกค้าทั้งหมด</div>
          <div className="kpi-value">{stats.customers}</div>
        </div>
      </section>

      {/* Hot deals */}
      <section className="card">
        <div className="card-header">
          <div className="card-title"><Flame size={18} style={{color:'var(--peach-400)'}}/> ดีลที่ต้องจัดการด่วน</div>
          <button className="link-btn" onClick={() => nav('/pipeline')}>ดูทั้งหมด →</button>
        </div>
        <div className="hot-list">
          {hotDeals.map(d => {
            const owner = team.find(t => t.id === d.assigned_to);
            return (
              <div key={d.id} className="hot-item" onClick={() => nav('/pipeline')}>
                <div className="hot-avatar" style={{background: owner?.color || 'var(--pink-200)'}}>
                  {owner?.avatar || '🦊'}
                </div>
                <div className="hot-info">
                  <div className="hot-title">{d.title}</div>
                  <div className="hot-company">{d.company} · <Clock size={12} style={{display:'inline'}}/> {daysAgo(d.last_activity)}</div>
                </div>
                <div className="hot-value">{THB(d.value)}</div>
              </div>
            );
          })}
          {hotDeals.length === 0 && <div className="empty">ยังไม่มีดีลด่วน 🌱</div>}
        </div>
      </section>

      {/* AI suggestion */}
      <section className="card ai-card">
        <div className="ai-badge"><Sparkles size={14}/> AI แนะนำ</div>
        <div className="ai-title">ติดตามดีลที่เงียบไปนาน</div>
        <div className="ai-text">
          มี {deals.filter(d=>{const dayDiff=(Date.now()-new Date(d.last_activity||d.created_at).getTime())/864e5;return dayDiff>5 && d.stage!=='won' && d.stage!=='lost';}).length} ดีลที่ไม่มีการเคลื่อนไหวเกิน 5 วัน — ลองส่งข้อความติดตามเพื่อกระตุ้นดู
        </div>
        <button className="btn-primary" onClick={() => nav('/tools')}>ให้ AI เขียนอีเมลให้ →</button>
      </section>

      {/* Team ranking */}
      <section className="card">
        <div className="card-header">
          <div className="card-title">🏆 อันดับทีม</div>
        </div>
        <div className="team-list">
          {[...team].sort((a,b)=>(b.closed||0)-(a.closed||0)).map((m,i) => (
            <div key={m.id} className="team-row">
              <div className="team-rank">#{i+1}</div>
              <div className="team-avatar" style={{background:m.color}}>{m.avatar}</div>
              <div className="team-info">
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.role}</div>
              </div>
              <div className="team-amount">
                <div className="team-value">{THB(m.closed)}</div>
                <div className="team-goal">เป้า {THB(m.goal)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
