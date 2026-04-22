// ==========================================
// Page: Tools (AI + Calculators)
// ==========================================

function ToolsPage({ pushToast }) {
  const [tab, setTab] = useState('ai-email');
  const [emailContext, setEmailContext] = useState('บริษัท CP ALL สนใจระบบ CRM สำหรับทีมขาย 50 คน งบ 2 ล้าน');
  const [emailOutput, setEmailOutput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [roiInput, setRoiInput] = useState({ price: 1500000, saveHours: 20, hourCost: 800, team: 10 });
  const roi = useMemo(() => {
    const annualSave = roiInput.saveHours * roiInput.hourCost * roiInput.team * 52;
    const payback = roiInput.price / (annualSave / 12);
    return {
      annualSave,
      payback,
      threeYearROI: ((annualSave * 3 - roiInput.price) / roiInput.price) * 100,
    };
  }, [roiInput]);

  const [dealContext, setDealContext] = useState('');
  const [dealAnalysis, setDealAnalysis] = useState(null);

  const genEmail = () => {
    setEmailLoading(true);
    setTimeout(() => {
      setEmailOutput(
`เรียน ผู้บริหาร CP ALL

ขอบคุณที่ให้ความสนใจในโซลูชัน CRM ของเราค่ะ 🙏

จากที่ได้พูดคุยกัน เราเข้าใจว่าทีมขาย 50 คนของท่านกำลังมองหาระบบที่ช่วย:
  ✨ รวบรวมข้อมูลลูกค้าในที่เดียว
  📊 วิเคราะห์ Pipeline แบบ real-time
  🎯 ติดตาม KPI ทีมได้ชัดเจน

โซลูชัน Zenith CRM ของเราจะช่วยให้ทีมของท่าน:
  • ปิดดีลเร็วขึ้น 30%
  • ลดเวลา admin 20 ชม./สัปดาห์/คน
  • ROI คาดการณ์ภายใน 8 เดือน

งบประมาณที่เสนอ: 2,000,000 บาท (รวม implementation + 1 ปี support)

หากสะดวก ขอนัดประชุม demo 30 นาทีในสัปดาห์หน้าได้ไหมคะ?

ขอบคุณค่ะ 🌸
สรวิชญ์ ต.
Zenith CRM Team`
      );
      setEmailLoading(false);
      pushToast({ emoji: '✨', title: 'AI สร้างอีเมลเสร็จแล้ว!' });
    }, 1200);
  };

  const analyzeDeal = () => {
    pushToast({ emoji: '🤖', title: 'AI กำลังวิเคราะห์...' });
    setTimeout(() => {
      setDealAnalysis({
        score: 78,
        strengths: ['งบชัดเจน 2M ฿', 'ผู้ตัดสินใจเข้าประชุมเอง', 'Timeline ระบุชัด Q2'],
        risks: ['มี competitor 2 เจ้า', 'ยังไม่คุย IT team'],
        next: 'นัด demo กับ IT lead ภายใน 3 วัน',
      });
    }, 1000);
  };

  const tabs = [
    { id: 'ai-email',  label: 'เขียนอีเมล AI',  emoji: '✉️' },
    { id: 'ai-deal',   label: 'วิเคราะห์ดีล',    emoji: '🧠' },
    { id: 'roi',       label: 'คำนวณ ROI',      emoji: '💰' },
  ];

  return (
    <div className="page">
      <div className="tools-header">
        <div>
          <div className="tools-title">🛠️ เครื่องมือ & AI</div>
          <div className="tools-sub">ตัวช่วยให้งานขายไวขึ้น 10 เท่า</div>
        </div>
      </div>

      <div className="tools-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tools-tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
            <span style={{fontSize: 20}}>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'ai-email' && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">✉️ สร้างอีเมลด้วย AI</div>
              <div className="panel-sub">บอกบริบท — AI เขียนให้</div>
            </div>
            <span className="badge-ai"><I.sparkle width={12} height={12}/> AI</span>
          </div>
          <div className="field-group">
            <label>บริบทลูกค้า</label>
            <textarea
              className="field-textarea"
              value={emailContext}
              onChange={(e) => setEmailContext(e.target.value)}
              rows={3}
              placeholder="เช่น บริษัท X สนใจ..."
            />
          </div>
          <button className="btn btn-primary btn-lg" onClick={genEmail} disabled={emailLoading}>
            {emailLoading ? <>⏳ กำลังสร้าง...</> : <><I.sparkle width={16} height={16}/> สร้างอีเมล</>}
          </button>
          {emailOutput && (
            <div className="ai-output">
              <div className="ai-output-head">
                <span>📬 ร่างอีเมล</span>
                <button className="btn-text" onClick={() => { navigator.clipboard?.writeText(emailOutput); pushToast({ emoji: '📋', title: 'คัดลอกแล้ว!'}); }}>
                  คัดลอก
                </button>
              </div>
              <pre className="ai-output-body">{emailOutput}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'ai-deal' && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">🧠 วิเคราะห์ดีลด้วย AI</div>
              <div className="panel-sub">ประเมินโอกาสปิด + แนะนำก้าวถัดไป</div>
            </div>
            <span className="badge-ai"><I.sparkle width={12} height={12}/> AI</span>
          </div>
          <div className="deal-picker">
            {DEALS.slice(0, 6).map(d => (
              <button key={d.id} className="deal-pick-chip" onClick={() => { setDealContext(d.company); analyzeDeal(); }}>
                {d.company}
              </button>
            ))}
          </div>
          {dealAnalysis && (
            <div className="deal-analysis">
              <div className="score-ring">
                <svg viewBox="0 0 100 100" style={{ width: 120, height: 120 }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--cream-200)" strokeWidth="10"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--mint-400)" strokeWidth="10"
                    strokeDasharray={`${dealAnalysis.score * 2.64} 264`} strokeLinecap="round"
                    transform="rotate(-90 50 50)"/>
                  <text x="50" y="55" textAnchor="middle" fontSize="24" fontWeight="900" fill="var(--ink-900)">{dealAnalysis.score}</text>
                </svg>
                <div>
                  <div className="score-label">คะแนนความเป็นไปได้</div>
                  <div className="score-big">{dealAnalysis.score}/100</div>
                  <div className="score-tag">โอกาสสูง 🎯</div>
                </div>
              </div>
              <div className="analysis-grid">
                <div className="analysis-box analysis-good">
                  <div className="analysis-head">✅ จุดแข็ง</div>
                  {dealAnalysis.strengths.map((s, i) => <div key={i} className="analysis-item">• {s}</div>)}
                </div>
                <div className="analysis-box analysis-bad">
                  <div className="analysis-head">⚠️ ความเสี่ยง</div>
                  {dealAnalysis.risks.map((s, i) => <div key={i} className="analysis-item">• {s}</div>)}
                </div>
              </div>
              <div className="next-action">
                <span>🎯 ก้าวถัดไป:</span> <b>{dealAnalysis.next}</b>
              </div>
            </div>
          )}
          {!dealAnalysis && <div className="empty-state">👆 เลือกดีลเพื่อให้ AI วิเคราะห์</div>}
        </div>
      )}

      {tab === 'roi' && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">💰 คำนวณ ROI</div>
              <div className="panel-sub">แสดงมูลค่าทางธุรกิจให้ลูกค้าเห็นชัด</div>
            </div>
          </div>
          <div className="roi-grid">
            <div className="roi-inputs">
              {[
                { key: 'price',     label: 'ราคาโซลูชัน (฿)', step: 100000 },
                { key: 'saveHours', label: 'ชั่วโมงที่ประหยัด/คน/สัปดาห์', step: 1 },
                { key: 'hourCost',  label: 'ค่าแรง/ชั่วโมง (฿)', step: 50 },
                { key: 'team',      label: 'จำนวนพนักงาน', step: 1 },
              ].map(f => (
                <div key={f.key} className="field-group">
                  <label>{f.label}</label>
                  <input
                    type="number"
                    className="field-input"
                    value={roiInput[f.key]}
                    step={f.step}
                    onChange={(e) => setRoiInput({ ...roiInput, [f.key]: Number(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
            <div className="roi-results">
              <div className="roi-result roi-result-mint">
                <div className="roi-label">ประหยัดได้/ปี</div>
                <div className="roi-value">{formatTHB(roi.annualSave)}</div>
              </div>
              <div className="roi-result roi-result-pink">
                <div className="roi-label">คืนทุน</div>
                <div className="roi-value">{roi.payback.toFixed(1)} เดือน</div>
              </div>
              <div className="roi-result roi-result-lavender">
                <div className="roi-label">ROI 3 ปี</div>
                <div className="roi-value">{roi.threeYearROI.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ToolsPage = ToolsPage;
