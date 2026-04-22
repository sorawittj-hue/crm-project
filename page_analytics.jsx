// ==========================================
// Page: Analytics (charts)
// ==========================================

function BarChart({ data, maxValue, height = 240 }) {
  const max = maxValue || Math.max(...data.map(d => Math.max(d.value, d.target || 0)));
  return (
    <div className="bars" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        const th = d.target ? (d.target / max) * 100 : 0;
        const hit = d.target && d.value >= d.target;
        return (
          <div key={i} className="bar-col">
            <div className="bar-stack">
              {d.target && (
                <div className="bar-target-line" style={{ bottom: `${th}%` }}>
                  <span>เป้า</span>
                </div>
              )}
              <div className={`bar ${hit ? 'bar-hit' : ''}`} style={{ height: `${h}%` }}>
                <div className="bar-value">{d.value.toFixed(1)}M</div>
              </div>
            </div>
            <div className="bar-label">{d.month || d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ data, size = 200 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const r = size / 2 - 18, cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--cream-200)" strokeWidth="18" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const len = C * frac;
          const off = C * acc;
          acc += frac;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
              strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off}
              transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round"/>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--ink-900)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-500)">ดีลทั้งหมด</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-dot" style={{ background: d.color }} />
            <span className="donut-label">{d.icon} {d.label}</span>
            <span className="donut-val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage({ deals }) {
  const [range, setRange] = useState('6m');
  const trend = REVENUE_TREND;

  // Stage distribution
  const stageDist = useMemo(() => STAGES.map(s => ({
    label: s.label, icon: s.icon, color: s.ink, value: deals.filter(d => d.stage === s.id).length,
  })).filter(d => d.value > 0), [deals]);

  // Team performance bars
  const teamData = TEAM.map(m => ({
    label: m.name.split(' ')[0],
    value: m.closed / 1_000_000,
    target: m.goal / 1_000_000,
  }));

  // Win rate
  const wonCount = deals.filter(d => d.stage === 'won').length;
  const winRate = Math.round((wonCount / deals.length) * 100);
  const avgDealSize = deals.reduce((s, d) => s + d.value, 0) / deals.length;
  const pipelineValue = deals.filter(d => d.stage !== 'won').reduce((s, d) => s + d.value, 0);
  const forecastValue = deals.filter(d => d.stage !== 'won').reduce((s, d) => s + d.value * d.probability / 100, 0);

  return (
    <div className="page">
      <div className="stats-grid">
        <StatCard emoji="🏆" tone="mint"     label="อัตราชนะ" value={winRate + '%'} delta={{ dir: 'up', text: '+5% เทียบเดือนก่อน' }}/>
        <StatCard emoji="💵" tone="pink"     label="ขนาดดีลเฉลี่ย" value={formatTHB(avgDealSize)} delta={{ dir: 'up', text: '+12%' }}/>
        <StatCard emoji="📈" tone="lavender" label="มูลค่า Pipeline" value={formatTHB(pipelineValue)} delta={{ dir: 'up', text: `${deals.length - wonCount} ดีล` }}/>
        <StatCard emoji="🔮" tone="peach"    label="คาดการณ์ (ถ่วงโอกาส)" value={formatTHB(forecastValue)} delta={{ dir: 'up', text: 'AI forecast' }}/>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">📈 ยอดขาย 6 เดือน</div>
            <div className="panel-sub">เทียบกับเป้าหมายรายเดือน (ล้าน ฿)</div>
          </div>
          <div className="pill-tabs">
            {['3m', '6m', '1y'].map(r => (
              <button key={r} className={`pill-tab ${range === r ? 'is-active' : ''}`} onClick={() => setRange(r)}>
                {r === '3m' ? '3 เดือน' : r === '6m' ? '6 เดือน' : '1 ปี'}
              </button>
            ))}
          </div>
        </div>
        <BarChart data={trend} />
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">🥧 สัดส่วนตาม Stage</div>
              <div className="panel-sub">ดีลในแต่ละสถานะ</div>
            </div>
          </div>
          <Donut data={stageDist} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">👥 ผลงานทีมขาย</div>
              <div className="panel-sub">ยอดปิด vs เป้า (ล้าน ฿)</div>
            </div>
          </div>
          <BarChart data={teamData} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">🎯 Conversion Funnel</div>
            <div className="panel-sub">อัตราการแปลงของแต่ละ Stage</div>
          </div>
        </div>
        <div className="funnel">
          {STAGES.map((s, i) => {
            const count = deals.filter(d => d.stage === s.id).length;
            const pct = Math.round((count / deals.length) * 100);
            const w = 100 - i * 12;
            return (
              <div key={s.id} className="funnel-row">
                <div className="funnel-bar" style={{ width: `${w}%`, background: s.tint, color: s.ink }}>
                  <span className="funnel-emoji">{s.icon}</span>
                  <span className="funnel-label">{s.label}</span>
                  <span className="funnel-count">{count} ดีล ({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.AnalyticsPage = AnalyticsPage;
