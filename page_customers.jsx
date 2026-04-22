// ==========================================
// Page: Customers
// ==========================================

function CustomersPage({ search, pushToast }) {
  const [tier, setTier] = useState('all');

  const filtered = useMemo(() => {
    let arr = CUSTOMERS;
    if (tier !== 'all') arr = arr.filter(c => c.tier === tier);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(c => (c.name + c.contact).toLowerCase().includes(q));
    }
    return arr.sort((a, b) => b.ltv - a.ltv);
  }, [tier, search]);

  const totalLTV = filtered.reduce((s, c) => s + c.ltv, 0);
  const avgLTV = filtered.length ? Math.round(totalLTV / filtered.length) : 0;
  const top = filtered[0];

  return (
    <div className="page">
      <div className="cust-stats">
        <div className="cust-stat cust-stat-pink">
          <div className="cust-stat-emoji">👥</div>
          <div className="cust-stat-num">{filtered.length}</div>
          <div className="cust-stat-label">ลูกค้าทั้งหมด</div>
        </div>
        <div className="cust-stat cust-stat-mint">
          <div className="cust-stat-emoji">💎</div>
          <div className="cust-stat-num">{formatTHB(totalLTV)}</div>
          <div className="cust-stat-label">มูลค่าตลอดอายุ (LTV)</div>
        </div>
        <div className="cust-stat cust-stat-lavender">
          <div className="cust-stat-emoji">⭐</div>
          <div className="cust-stat-num">{formatTHB(avgLTV)}</div>
          <div className="cust-stat-label">LTV เฉลี่ย</div>
        </div>
        <div className="cust-stat cust-stat-peach">
          <div className="cust-stat-emoji">👑</div>
          <div className="cust-stat-num" style={{ fontSize: 16 }}>{top?.name?.slice(0, 15) || '-'}</div>
          <div className="cust-stat-label">ลูกค้า VIP สูงสุด</div>
        </div>
      </div>

      <div className="cust-toolbar">
        <div className="pill-tabs">
          {['all', 'platinum', 'gold', 'silver', 'bronze'].map(t => (
            <button key={t} className={`pill-tab ${tier === t ? 'is-active' : ''}`} onClick={() => setTier(t)}>
              {t === 'all' ? 'ทั้งหมด' : TIER_META[t].emoji + ' ' + TIER_META[t].label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => pushToast({ emoji: '✨', title: 'เพิ่มลูกค้าใหม่' })}>
          <I.plus width={16} height={16}/> เพิ่มลูกค้า
        </button>
      </div>

      <div className="cust-grid">
        {filtered.map(c => {
          const owner = TEAM.find(m => m.id === c.owner);
          const meta = TIER_META[c.tier];
          const days = Math.floor((Date.now() - new Date(c.last).getTime()) / 86400000);
          return (
            <div key={c.id} className="cust-card" onClick={() => pushToast({ emoji: '👁️', title: 'เปิดโปรไฟล์', body: c.name })}>
              <div className="cust-card-head">
                <div className="cust-avatar" style={{ background: meta.color, color: meta.ink }}>
                  {c.name.trim().charAt(0)}
                </div>
                <div className="cust-tier" style={{ background: meta.color, color: meta.ink }}>
                  {meta.emoji} {meta.label}
                </div>
              </div>
              <div className="cust-name">{c.name}</div>
              <div className="cust-contact">{c.contact}</div>
              <div className="cust-row">
                <div>
                  <div className="cust-small">LTV</div>
                  <div className="cust-big">{formatTHB(c.ltv)}</div>
                </div>
                <div>
                  <div className="cust-small">ดีล</div>
                  <div className="cust-big">{c.deals}</div>
                </div>
              </div>
              <div className="cust-foot">
                <span className="cust-owner-chip" style={{ background: owner.color }}>
                  {owner.avatar} {owner.name.split(' ')[0]}
                </span>
                <span className="cust-last">🕒 {days}ว.ก่อน</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.CustomersPage = CustomersPage;
