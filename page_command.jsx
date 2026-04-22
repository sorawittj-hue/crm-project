// ==========================================
// Page: Command Center (Home)
// ==========================================

function StatCard({ emoji, label, value, delta, tone = 'pink' }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-emoji">{emoji}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && (
        <div className={`stat-delta ${delta.dir === 'up' ? 'up' : 'down'}`}>
          {delta.dir === 'up' ? <I.arrowUp width={12} height={12}/> : <I.arrowDn width={12} height={12}/>}
          {delta.text}
        </div>
      )}
    </div>
  );
}

function CommandPage({ pushToast, setPage }) {
  const wonThisMonth = DEALS.filter(d => d.stage === 'won').reduce((s, d) => s + d.value, 0);
  const openDeals   = DEALS.filter(d => d.stage !== 'won').length;
  const pipelineVal = DEALS.filter(d => d.stage !== 'won').reduce((s, d) => s + d.value, 0);
  const hotDeals    = DEALS.filter(d => d.tags.includes('hot')).length;

  // Mini sparkline path (last 6 months)
  const spark = useMemo(() => {
    const vals = REVENUE_TREND.map(r => r.value);
    const max = Math.max(...vals);
    const W = 120, H = 40;
    return vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - (v / max) * H;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, []);

  return (
    <div className="page">
      {/* Greeting hero */}
      <div className="hero-card">
        <div className="hero-bg-deco">
          <div className="deco-blob deco-blob-1" />
          <div className="deco-blob deco-blob-2" />
          <div className="deco-blob deco-blob-3" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨</span>
            <span>วันอังคารที่ 21 เมษายน 2569</span>
          </div>
          <h1 className="hero-title">สวัสดีตอนเช้า คุณสรวิชญ์ 🌸</h1>
          <p className="hero-sub">
            วันนี้คุณมีดีลสำคัญ <b>3 รายการ</b> ที่ต้องติดตาม และมีประชุมนัดใหม่ <b>2 นัด</b>
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => setPage('pipeline')}>
              <I.pipeline width={16} height={16}/> ดูดีลทั้งหมด
            </button>
            <button className="btn btn-ghost" onClick={() => pushToast({ emoji: '🤖', title: 'AI กำลังวางแผน...', body: 'วิเคราะห์ 18 ดีล กรุณารอสักครู่'})}>
              <I.sparkle width={16} height={16}/> AI Battle Plan
            </button>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="hero-illo-card hero-illo-1">
            <div className="tiny-emoji">🦊</div>
            <div>
              <div className="tiny-label">อันดับ 1</div>
              <div className="tiny-value">ทีม</div>
            </div>
          </div>
          <div className="hero-illo-card hero-illo-2">
            <div className="tiny-emoji">🔥</div>
            <div>
              <div className="tiny-label">ดีลร้อน</div>
              <div className="tiny-value">{hotDeals} ดีล</div>
            </div>
          </div>
          <div className="hero-illo-card hero-illo-3">
            <svg viewBox="0 0 120 40" style={{ width: 110, height: 36 }}>
              <defs>
                <linearGradient id="sparkg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--pink-400)" />
                  <stop offset="100%" stopColor="var(--pink-400)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={spark + ' L 120 40 L 0 40 Z'} fill="url(#sparkg)" />
              <path d={spark} fill="none" stroke="var(--pink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="tiny-label" style={{marginTop: 2}}>เทรนด์ 6 เดือน</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        <StatCard emoji="💰" tone="mint"     label="ยอดขายเดือนนี้" value={formatTHB(wonThisMonth)} delta={{ dir: 'up', text: '+18% vs เดือนก่อน' }}/>
        <StatCard emoji="📊" tone="lavender" label="มูลค่าใน Pipeline" value={formatTHB(pipelineVal)} delta={{ dir: 'up', text: '14 ดีล active' }}/>
        <StatCard emoji="🎯" tone="pink"     label="ดีลเปิดอยู่" value={openDeals + ' ดีล'} delta={{ dir: 'up', text: `${hotDeals} ดีลร้อน` }}/>
        <StatCard emoji="🏆" tone="peach"    label="อัตราปิดดีล" value="68%" delta={{ dir: 'up', text: '+5% จากเดือนก่อน' }}/>
      </div>

      <div className="two-col">
        {/* Urgent deals */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">🔥 ดีลต้องลุยวันนี้</div>
              <div className="panel-sub">ดีลร้อน + ใกล้ปิด</div>
            </div>
            <button className="btn-text" onClick={() => setPage('pipeline')}>ดูทั้งหมด →</button>
          </div>
          <div className="urgent-list">
            {DEALS.filter(d => d.tags.includes('hot') || d.tags.includes('closing')).slice(0, 4).map(d => {
              const owner = TEAM.find(m => m.id === d.owner);
              const stage = STAGES.find(s => s.id === d.stage);
              return (
                <div key={d.id} className="urgent-item" onClick={() => pushToast({ emoji: '👁️', title: 'เปิดดีล', body: d.company })}>
                  <div className="urgent-emoji" style={{ background: stage.tint }}>{stage.icon}</div>
                  <div className="urgent-main">
                    <div className="urgent-title">{d.title}</div>
                    <div className="urgent-meta">
                      <span>{d.company}</span>
                      <span className="dot-sep">•</span>
                      <span>{owner.avatar} {owner.name}</span>
                    </div>
                  </div>
                  <div className="urgent-right">
                    <div className="urgent-value">{formatTHB(d.value)}</div>
                    <div className="urgent-prob">{d.probability}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Mandates */}
        <div className="panel panel-gradient">
          <div className="panel-head">
            <div>
              <div className="panel-title">🤖 AI แนะนำ</div>
              <div className="panel-sub">สิ่งที่ควรทำวันนี้</div>
            </div>
            <span className="badge-ai"><I.sparkle width={12} height={12}/> AI</span>
          </div>
          <div className="mandate-list">
            {STRATEGIC_MANDATES.map(m => (
              <div key={m.id} className={`mandate-item priority-${m.priority}`}>
                <div className="mandate-emoji">{m.emoji}</div>
                <div className="mandate-body">
                  <div className="mandate-title">{m.title}</div>
                  <div className="mandate-sub">{m.subtitle}</div>
                </div>
                <button className="mandate-go" onClick={() => pushToast({ emoji: m.emoji, title: 'เริ่มงาน', body: m.title })}>
                  <I.arrow width={14} height={14}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team leaderboard */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">🏆 อันดับทีม</div>
            <div className="panel-sub">ประสิทธิภาพเดือนเมษายน</div>
          </div>
        </div>
        <div className="team-grid">
          {TEAM.map((m, i) => {
            const pct = Math.round((m.closed / m.goal) * 100);
            return (
              <div key={m.id} className="team-card">
                <div className="team-rank">#{i + 1}</div>
                <div className="team-avatar" style={{ background: m.color }}>{m.avatar}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.role}</div>
                <div className="team-progress-row">
                  <span className="team-closed">{formatTHB(m.closed)}</span>
                  <span className="team-pct">{pct}%</span>
                </div>
                <div className="team-bar">
                  <div className="team-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: m.color }} />
                </div>
                <div className="team-goal">เป้า {formatTHB(m.goal)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity feed */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">🌊 กิจกรรมล่าสุด</div>
            <div className="panel-sub">สิ่งที่เพิ่งเกิดขึ้นในทีม</div>
          </div>
        </div>
        <div className="activity-list">
          {ACTIVITY_FEED.map(a => (
            <div key={a.id} className="activity-item">
              <div className={`activity-emoji activity-${a.kind}`}>{a.emoji}</div>
              <div className="activity-body">
                <div className="activity-text">
                  <b>{a.who}</b> {a.what} — <span className="activity-obj">{a.obj}</span>
                </div>
                <div className="activity-time">{a.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.CommandPage = CommandPage;
