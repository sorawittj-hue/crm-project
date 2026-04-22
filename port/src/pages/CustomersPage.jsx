// src/pages/CustomersPage.jsx
import { useMemo, useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useTeam } from '../hooks/useTeam';
import { useAppStore } from '../store/useAppStore';

const TIERS = {
  platinum: { label: 'Platinum', color: 'linear-gradient(135deg,#E8E1FF,#D4C7FF)', emoji: '💎' },
  gold:     { label: 'Gold',     color: 'linear-gradient(135deg,#FFF0D0,#FFD98A)', emoji: '⭐' },
  silver:   { label: 'Silver',   color: 'linear-gradient(135deg,#E8EEF5,#CAD6E4)', emoji: '🌟' },
  bronze:   { label: 'Bronze',   color: 'linear-gradient(135deg,#FFE4CF,#FFC59A)', emoji: '🌱' },
};

const THB = (n) => n>=1_000_000 ? (n/1_000_000).toFixed(1)+'M' : Math.round(n/1000)+'K';

export default function CustomersPage() {
  const { data: customers = [] } = useCustomers();
  const { data: team = [] } = useTeam();
  const { globalSearchTerm } = useAppStore();
  const [tier, setTier] = useState('all');

  const list = useMemo(() => {
    let arr = customers;
    if (tier !== 'all') arr = arr.filter(c => c.tier === tier);
    if (globalSearchTerm) {
      const q = globalSearchTerm.toLowerCase();
      arr = arr.filter(c => (c.name||'').toLowerCase().includes(q) || (c.contact||'').toLowerCase().includes(q));
    }
    return arr;
  }, [customers, tier, globalSearchTerm]);

  return (
    <div className="page-cust">
      <div className="pipe-filters">
        <button className={`chip ${tier==='all'?'is-on':''}`} onClick={()=>setTier('all')}>ทั้งหมด ({customers.length})</button>
        {Object.entries(TIERS).map(([k,v]) => (
          <button key={k} className={`chip ${tier===k?'is-on':''}`} onClick={()=>setTier(k)}>
            {v.emoji} {v.label} ({customers.filter(c=>c.tier===k).length})
          </button>
        ))}
      </div>
      <div className="cust-grid">
        {list.map(c => {
          const tierInfo = TIERS[c.tier] || TIERS.bronze;
          const owner = team.find(t => t.id === c.assigned_to);
          return (
            <div key={c.id} className="cust-card">
              <div className="cust-tier" style={{background:tierInfo.color}}>{tierInfo.emoji} {tierInfo.label}</div>
              <div className="cust-name">{c.name}</div>
              <div className="cust-contact">{c.contact}</div>
              <div className="cust-stats">
                <div><div className="cs-label">LTV</div><div className="cs-val">{THB(c.lifetime_value||0)} ฿</div></div>
                <div><div className="cs-label">ดีล</div><div className="cs-val">{c.deal_count||0}</div></div>
              </div>
              <div className="cust-foot">
                <div className="cust-owner" style={{background:owner?.color||'var(--pink-200)'}}>{owner?.avatar||'🦊'}</div>
                <div className="cust-last">ติดต่อล่าสุด {c.last_contact ? new Date(c.last_contact).toLocaleDateString('th-TH') : '—'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
