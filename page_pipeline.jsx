// ==========================================
// Page: Pipeline (Kanban + drag & drop)
// ==========================================

function PipelineCard({ deal, onDragStart, onDragEnd, dragging, onClick }) {
  const owner = TEAM.find(m => m.id === deal.owner);
  const daysSince = Math.floor((Date.now() - new Date(deal.last).getTime()) / 86400000);
  const isStale = daysSince >= 7;
  const isCritical = daysSince >= 14;
  const isHot = deal.tags.includes('hot');
  const isClosing = deal.tags.includes('closing');

  return (
    <div
      className={`pipe-card ${dragging ? 'is-dragging' : ''} ${isCritical ? 'is-critical' : isStale ? 'is-stale' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onDragEnd={onDragEnd}
      onClick={() => onClick && onClick(deal)}
    >
      {(isHot || isClosing) && (
        <div className="pipe-tags">
          {isHot && <span className="pipe-tag pipe-tag-hot">🔥 ร้อน</span>}
          {isClosing && <span className="pipe-tag pipe-tag-closing">⚡ ใกล้ปิด</span>}
        </div>
      )}
      <div className="pipe-company">{deal.company}</div>
      <div className="pipe-title">{deal.title}</div>
      <div className="pipe-meta">
        <div className="pipe-owner" title={owner.name}>
          <span className="pipe-owner-avatar" style={{ background: owner.color }}>{owner.avatar}</span>
        </div>
        <div className={`pipe-days ${isCritical ? 'critical' : isStale ? 'stale' : ''}`}>
          <I.clock width={11} height={11}/> {daysSince}ว.
        </div>
      </div>
      <div className="pipe-foot">
        <div className="pipe-value">{formatTHB(deal.value)}</div>
        <div className="pipe-prob">
          <div className="pipe-prob-bar">
            <div className="pipe-prob-fill" style={{ width: `${deal.probability}%` }} />
          </div>
          <span>{deal.probability}%</span>
        </div>
      </div>
    </div>
  );
}

function PipelinePage({ deals, setDeals, pushToast, search }) {
  const [dragId, setDragId] = useState(null);
  const [hoverStage, setHoverStage] = useState(null);
  const [filter, setFilter] = useState('all'); // all | hot | stale

  const filtered = useMemo(() => {
    let arr = deals;
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(d => (d.title + d.company + d.contact).toLowerCase().includes(q));
    }
    if (filter === 'hot') arr = arr.filter(d => d.tags.includes('hot') || d.tags.includes('closing'));
    if (filter === 'stale') {
      arr = arr.filter(d => {
        const days = Math.floor((Date.now() - new Date(d.last).getTime()) / 86400000);
        return days >= 7;
      });
    }
    return arr;
  }, [deals, search, filter]);

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach(s => map[s.id] = []);
    filtered.forEach(d => map[d.stage]?.push(d));
    return map;
  }, [filtered]);

  const onDragStart = (e, deal) => {
    setDragId(deal.id);
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', deal.id); } catch {}
  };
  const onDragEnd = () => { setDragId(null); setHoverStage(null); };

  const onDrop = (stageId) => {
    if (!dragId) return;
    const deal = deals.find(d => d.id === dragId);
    if (!deal || deal.stage === stageId) { setDragId(null); setHoverStage(null); return; }
    const stage = STAGES.find(s => s.id === stageId);
    setDeals(deals.map(d => d.id === dragId ? { ...d, stage: stageId, last: new Date().toISOString() } : d));
    pushToast({
      emoji: stageId === 'won' ? '🎉' : stage.icon,
      title: stageId === 'won' ? 'ปิดดีลสำเร็จ!' : 'ย้ายดีลแล้ว',
      body: `${deal.company} → ${stage.label}`,
    });
    setDragId(null); setHoverStage(null);
  };

  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <div className="page">
      <div className="pipe-toolbar">
        <div className="pipe-toolbar-stats">
          <div className="pipe-stat"><span>ดีลทั้งหมด</span><b>{filtered.length}</b></div>
          <div className="pipe-stat-divider"/>
          <div className="pipe-stat"><span>มูลค่ารวม</span><b>{formatTHB(total)}</b></div>
        </div>
        <div className="pipe-toolbar-right">
          <div className="pill-tabs">
            {['all', 'hot', 'stale'].map(f => (
              <button key={f} className={`pill-tab ${filter === f ? 'is-active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'ทั้งหมด' : f === 'hot' ? '🔥 ร้อน' : '⏰ เงียบ'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => pushToast({ emoji: '✨', title: 'เพิ่มดีลใหม่', body: 'เปิดฟอร์มสร้างดีล' })}>
            <I.plus width={16} height={16}/> เพิ่มดีล
          </button>
        </div>
      </div>

      <div className="kanban">
        {STAGES.map(stage => {
          const col = byStage[stage.id] || [];
          const colTotal = col.reduce((s, d) => s + d.value, 0);
          return (
            <div
              key={stage.id}
              className={`kanban-col ${hoverStage === stage.id ? 'is-hover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setHoverStage(stage.id); }}
              onDragLeave={() => setHoverStage(null)}
              onDrop={() => onDrop(stage.id)}
              style={{ '--col-tint': stage.tint, '--col-ink': stage.ink }}
            >
              <div className="kanban-head">
                <div className="kanban-head-left">
                  <span className="kanban-emoji" style={{ background: stage.tint }}>{stage.icon}</span>
                  <div>
                    <div className="kanban-label">{stage.label}</div>
                    <div className="kanban-count">{col.length} ดีล · {formatTHB(colTotal)}</div>
                  </div>
                </div>
              </div>
              <div className="kanban-body">
                {col.map(d => (
                  <PipelineCard
                    key={d.id}
                    deal={d}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    dragging={dragId === d.id}
                    onClick={() => pushToast({ emoji: '👁️', title: 'ดูรายละเอียด', body: d.company })}
                  />
                ))}
                {col.length === 0 && (
                  <div className="kanban-empty">
                    <span style={{ fontSize: 24, opacity: 0.4 }}>🌸</span>
                    <span>ลากดีลมาวางที่นี่</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.PipelinePage = PipelinePage;
