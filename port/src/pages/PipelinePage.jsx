// src/pages/PipelinePage.jsx
// Kanban + drag & drop → update Supabase ผ่าน useUpdateDeal

import { useMemo, useState } from 'react';
import { Flame, Clock } from 'lucide-react';
import { useDeals, useUpdateDeal } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useAppStore } from '../store/useAppStore';

const STAGES = [
  { id: 'lead',        label: 'ลูกค้าใหม่',    color: 'var(--sky-200)',   emoji: '🌱' },
  { id: 'qualified',   label: 'คุยแล้ว',       color: 'var(--lav-200)',   emoji: '💬' },
  { id: 'proposal',    label: 'เสนอราคา',      color: 'var(--peach-200)', emoji: '📋' },
  { id: 'negotiation', label: 'ต่อรอง',        color: 'var(--pink-200)',  emoji: '🤝' },
  { id: 'won',         label: 'ปิดการขาย!',    color: 'var(--mint-200)',  emoji: '🎉' },
];

const THB = (n) => n >= 1_000_000 ? (n/1_000_000).toFixed(2).replace(/\.?0+$/,'')+'M' : Math.round(n/1000)+'K';

export default function PipelinePage() {
  const { data: deals = [] } = useDeals();
  const { data: team = [] } = useTeam();
  const update = useUpdateDeal();
  const { globalSearchTerm } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const filtered = useMemo(() => {
    let list = deals.filter(d => d.stage !== 'lost');
    if (filter === 'hot') list = list.filter(d => (d.tags || []).includes('hot'));
    if (filter === 'stale') list = list.filter(d => {
      const days = (Date.now() - new Date(d.last_activity || d.created_at).getTime()) / 864e5;
      return days > 5;
    });
    if (globalSearchTerm) {
      const q = globalSearchTerm.toLowerCase();
      list = list.filter(d =>
        (d.title||'').toLowerCase().includes(q) ||
        (d.company||'').toLowerCase().includes(q) ||
        (d.contact||'').toLowerCase().includes(q));
    }
    return list;
  }, [deals, filter, globalSearchTerm]);

  const handleDrop = (stage) => {
    if (!dragId) return;
    const d = deals.find(x => x.id === dragId);
    if (d && d.stage !== stage) update.mutate({ id: dragId, stage });
    setDragId(null); setDragOver(null);
  };

  return (
    <div className="page-pipe">
      <div className="pipe-filters">
        <button className={`chip ${filter==='all'?'is-on':''}`} onClick={()=>setFilter('all')}>ทั้งหมด ({deals.filter(d=>d.stage!=='lost').length})</button>
        <button className={`chip ${filter==='hot'?'is-on':''}`} onClick={()=>setFilter('hot')}>🔥 ด่วน ({deals.filter(d=>(d.tags||[]).includes('hot')).length})</button>
        <button className={`chip ${filter==='stale'?'is-on':''}`} onClick={()=>setFilter('stale')}>💤 เงียบ 5 วัน+</button>
      </div>

      <div className="kanban">
        {STAGES.map(stage => {
          const items = filtered.filter(d => d.stage === stage.id);
          const total = items.reduce((s,d)=>s+Number(d.value||0),0);
          return (
            <div key={stage.id}
              className={`kcol ${dragOver===stage.id?'is-over':''}`}
              onDragOver={(e)=>{e.preventDefault();setDragOver(stage.id);}}
              onDragLeave={()=>setDragOver(null)}
              onDrop={()=>handleDrop(stage.id)}>
              <div className="kcol-head" style={{background:stage.color}}>
                <div className="kcol-title">{stage.emoji} {stage.label}</div>
                <div className="kcol-meta">{items.length} · {THB(total)} ฿</div>
              </div>
              <div className="kcol-list">
                {items.map(d => {
                  const owner = team.find(t => t.id === d.assigned_to);
                  const days = Math.floor((Date.now() - new Date(d.last_activity||d.created_at).getTime()) / 864e5);
                  return (
                    <div key={d.id}
                      className={`kcard ${dragId===d.id?'is-dragging':''}`}
                      draggable
                      onDragStart={()=>setDragId(d.id)}
                      onDragEnd={()=>{setDragId(null);setDragOver(null);}}>
                      {(d.tags||[]).includes('hot') && <div className="kcard-hot"><Flame size={10}/> ด่วน</div>}
                      <div className="kcard-title">{d.title}</div>
                      <div className="kcard-co">{d.company}</div>
                      <div className="kcard-foot">
                        <div className="kcard-val">{THB(d.value)} ฿</div>
                        <div className="kcard-owner" style={{background:owner?.color||'var(--pink-200)'}}>{owner?.avatar||'🦊'}</div>
                      </div>
                      <div className="kcard-meta"><Clock size={10}/> {days===0?'วันนี้':`${days} วันก่อน`} · {d.probability||0}%</div>
                    </div>
                  );
                })}
                {items.length===0 && <div className="kcol-empty">ยังไม่มีดีล</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
