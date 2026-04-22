// src/pages/ToolsPage.jsx
import { useState } from 'react';
import { Mail, Sparkles, Calculator, Loader2 } from 'lucide-react';

export default function ToolsPage() {
  const [tab, setTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  // Email writer
  const [emailCtx, setEmailCtx] = useState({ customer:'', deal:'', tone:'friendly' });

  // ROI
  const [roi, setRoi] = useState({ invest:'', revenue:'', months:'' });

  const writeEmail = async () => {
    setLoading(true); setOutput('');
    try {
      const res = await window.claude.complete({
        messages: [{ role:'user', content:
          `เขียนอีเมลภาษาไทยถึงลูกค้า ชื่อ "${emailCtx.customer}" เรื่องดีล "${emailCtx.deal}" ในโทน ${emailCtx.tone}. ความยาวไม่เกิน 200 คำ ลงท้ายด้วย "ด้วยความเคารพ"` }],
      });
      setOutput(res);
    } catch(e) { setOutput('เกิดข้อผิดพลาด: ' + e.message); }
    setLoading(false);
  };

  const calcROI = () => {
    const inv = Number(roi.invest), rev = Number(roi.revenue), m = Number(roi.months);
    if (!inv || !rev || !m) return;
    const net = rev - inv;
    const pct = (net / inv * 100).toFixed(1);
    const monthly = (net / m).toFixed(0);
    setOutput(`💰 กำไรสุทธิ: ${net.toLocaleString()} ฿\n📈 ROI: ${pct}%\n📅 กำไรเฉลี่ย/เดือน: ${Number(monthly).toLocaleString()} ฿`);
  };

  return (
    <div className="page-tools">
      <div className="tools-tabs">
        <button className={`tool-tab ${tab==='email'?'is-on':''}`} onClick={()=>{setTab('email');setOutput('');}}><Mail size={16}/> AI เขียนอีเมล</button>
        <button className={`tool-tab ${tab==='analyze'?'is-on':''}`} onClick={()=>{setTab('analyze');setOutput('');}}><Sparkles size={16}/> วิเคราะห์ดีล</button>
        <button className={`tool-tab ${tab==='roi'?'is-on':''}`} onClick={()=>{setTab('roi');setOutput('');}}><Calculator size={16}/> คำนวณ ROI</button>
      </div>

      <div className="card">
        {tab==='email' && (
          <div className="tool-form">
            <label>ชื่อลูกค้า<input value={emailCtx.customer} onChange={e=>setEmailCtx({...emailCtx,customer:e.target.value})} placeholder="คุณสมชาย"/></label>
            <label>เรื่อง/ดีล<input value={emailCtx.deal} onChange={e=>setEmailCtx({...emailCtx,deal:e.target.value})} placeholder="ติดตามข้อเสนอ ERP"/></label>
            <label>โทน
              <select value={emailCtx.tone} onChange={e=>setEmailCtx({...emailCtx,tone:e.target.value})}>
                <option value="friendly">เป็นกันเอง</option>
                <option value="formal">ทางการ</option>
                <option value="urgent">เร่งด่วน</option>
              </select>
            </label>
            <button className="btn-primary" onClick={writeEmail} disabled={loading||!emailCtx.customer}>
              {loading?<><Loader2 size={16} className="spin"/> กำลังเขียน...</>:'เขียนอีเมลให้หน่อย ✨'}
            </button>
          </div>
        )}

        {tab==='analyze' && (
          <div className="tool-form">
            <label>รายละเอียดดีล<textarea placeholder="อธิบายดีลที่อยากให้ AI วิเคราะห์..." rows={6}/></label>
            <button className="btn-primary" onClick={async()=>{
              setLoading(true);
              const res = await window.claude.complete({messages:[{role:'user',content:'วิเคราะห์ดีลนี้ในภาษาไทย ให้คำแนะนำ 3 ข้อเป็น bullet'}]});
              setOutput(res); setLoading(false);
            }} disabled={loading}>{loading?'กำลังวิเคราะห์...':'วิเคราะห์ให้หน่อย 🔍'}</button>
          </div>
        )}

        {tab==='roi' && (
          <div className="tool-form">
            <label>เงินลงทุน (฿)<input type="number" value={roi.invest} onChange={e=>setRoi({...roi,invest:e.target.value})}/></label>
            <label>รายได้ที่คาด (฿)<input type="number" value={roi.revenue} onChange={e=>setRoi({...roi,revenue:e.target.value})}/></label>
            <label>ระยะเวลา (เดือน)<input type="number" value={roi.months} onChange={e=>setRoi({...roi,months:e.target.value})}/></label>
            <button className="btn-primary" onClick={calcROI}>คำนวณ 🧮</button>
          </div>
        )}

        {output && <div className="tool-output">{output}</div>}
      </div>
    </div>
  );
}
