import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  Calculator, Mail, Sliders,
  CheckCircle, Loader2, Copy, FileText
} from 'lucide-react';
import { Textarea } from '../components/ui/Textarea';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);
const formatPercent = (num) => `${(Math.round(num * 100) / 100).toFixed(0)}%`;

// ROI Calculator (Deterministic)
const ROICalculator = () => {
  const [inputs, setInputs] = useState({ initialInvestment: '', monthlyRevenue: '', monthlyCost: '', period: '12' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const investment = Number(inputs.initialInvestment) || 0;
    const revenue = Number(inputs.monthlyRevenue) || 0;
    const cost = Number(inputs.monthlyCost) || 0;
    const months = Number(inputs.period) || 12;
    const monthlyProfit = revenue - cost;
    const totalReturn = monthlyProfit * months;
    const roi = investment > 0 ? ((totalReturn - investment) / investment) * 100 : 0;
    const paybackPeriod = monthlyProfit > 0 ? investment / monthlyProfit : Infinity;

    setResults({ monthlyProfit, totalReturn, roi, paybackPeriod: Math.round(paybackPeriod) });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Initial Investment</label>
          <Input type="number" placeholder="500000" value={inputs.initialInvestment} onChange={(e) => setInputs({ ...inputs, initialInvestment: e.target.value })} className="rounded-xl border-slate-200" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Revenue</label>
          <Input type="number" placeholder="100000" value={inputs.monthlyRevenue} onChange={(e) => setInputs({ ...inputs, monthlyRevenue: e.target.value })} className="rounded-xl border-slate-200" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Cost</label>
          <Input type="number" placeholder="30000" value={inputs.monthlyCost} onChange={(e) => setInputs({ ...inputs, monthlyCost: e.target.value })} className="rounded-xl border-slate-200" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Period (Months)</label>
          <Input type="number" value={inputs.period} onChange={(e) => setInputs({ ...inputs, period: e.target.value })} className="rounded-xl border-slate-200" />
        </div>
      </div>

      <Button onClick={calculate} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:scale-[1.01] transition-all">Execute ROI Logic</Button>

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100/50">
            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1 leading-none">Monthly Profit</p>
            <p className="text-xl font-black text-emerald-600 tabular-nums leading-none mt-2">{formatCurrency(results.monthlyProfit)}</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Total Return</p>
            <p className="text-xl font-black text-slate-900 tabular-nums leading-none mt-2">{formatCurrency(results.totalReturn)}</p>
          </div>
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 leading-none">ROI Index</p>
            <p className={cn("text-xl font-black tabular-nums leading-none mt-2", results.roi >= 0 ? "text-primary" : "text-rose-600")}>{formatPercent(results.roi / 100)}</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900 border-0">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 leading-none">Payback Window</p>
            <p className="text-xl font-black text-white tabular-nums leading-none mt-2">{results.paybackPeriod === Infinity ? '∞' : `${results.paybackPeriod} mo`}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Logic Protocol Generator (Template-based Email)
const LogicProtocolGenerator = () => {
  const [inputs, setInputs] = useState({ type: 'follow_up', recipient: '', context: '', tone: 'professional' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const generate = () => {
    setIsGenerating(true);
    setTimeout(() => {
        // Deterministic templates based on type
        const templates = {
            follow_up: { subject: "ติดตามเรื่องใบเสนอราคา - [RECIPIENT]", body: "เรียนคุณ [RECIPIENT],\n\nผมเจจาก Zenith ครับ ต้องการติดตามผลการพิจารณาใบเสนอราคาที่เราส่งให้เมื่อสัปดาห์ก่อนเกี่ยวกับ [CONTEXT] ครับ ไม่ทราบว่ามีข้อสงสัยหรือต้องการให้ปรับปรุงตรงส่วนไหนไหมครับ\n\nหวังว่าจะได้ร่วมงานกันครับ" },
            proposal: { subject: "ข้อเสนอโครงการพิเศษ - [RECIPIENT]", body: "เรียนคุณ [RECIPIENT],\n\nอ้างถึงการพูดคุยกันเรื่อง [CONTEXT] ผมได้จัดทำข้อเสนอที่ตอบโจทย์ความต้องการของบริษัทคุณไว้ให้ตามรายละเอียดแนบครับ\n\nขอบคุณครับ" },
            thank_you: { subject: "ขอบคุณที่มอบความไว้วางใจให้เรา - [RECIPIENT]", body: "เรียนคุณ [RECIPIENT],\n\nในนามของทีมงานขอขอบคุณที่เลือกใช้บริการของเราในโปรเจกต์ [CONTEXT] ครับ เราจะดูแลให้ออกมาดีที่สุดครับ\n\nด้วยความเคารพ" }
        };
        const template = templates[inputs.type] || templates.follow_up;
        setResult({
            subject: template.subject.replace('[RECIPIENT]', inputs.recipient || 'ลูกค้า'),
            body: template.body.replace('[RECIPIENT]', inputs.recipient || 'ลูกค้า').replace('[CONTEXT]', inputs.context || 'โครงการของเรา')
        });
        setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = () => {
    if (result) navigator.clipboard.writeText(`${result.subject}\n\n${result.body}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</label>
          <select value={inputs.type} onChange={(e) => setInputs({ ...inputs, type: e.target.value })} className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none border-0 ring-1 ring-slate-200">
            <option value="follow_up">Follow-up Protocol</option>
            <option value="proposal">Closing Sequence</option>
            <option value="thank_you">Post-Sale Success</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tone Matrix</label>
          <select value={inputs.tone} onChange={(e) => setInputs({ ...inputs, tone: e.target.value })} className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none border-0 ring-1 ring-slate-200">
            <option value="professional">Professional Engagement</option>
            <option value="friendly">Direct Collaborative</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Identity</label>
        <Input placeholder="Enter Enterprise Name..." value={inputs.recipient} onChange={(e) => setInputs({ ...inputs, recipient: e.target.value })} className="rounded-2xl h-12 border-slate-200" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Context Variables</label>
        <Textarea placeholder="Define engagement parameters..." value={inputs.context} onChange={(e) => setInputs({ ...inputs, context: e.target.value })} className="min-h-[100px] rounded-[1.5rem] border-slate-200" />
      </div>
      <Button onClick={generate} disabled={isGenerating} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10">
        {isGenerating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Mail className="mr-2" size={16} />}
        {isGenerating ? 'Compiling Registry...' : 'Generate Protocol'}
      </Button>
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Generated Protocol</h4>
            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-[10px] font-black text-primary uppercase"><Copy size={14} className="mr-2" /> Copy to Clipboard</Button>
          </div>
          <div className="p-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm space-y-3">
            <div className="flex gap-4">
                <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">Subject:</span>
                <p className="text-sm font-black text-slate-900">{result.subject}</p>
            </div>
            <div className="h-[1px] bg-slate-50 w-full" />
            <p className="text-sm text-slate-600 whitespace-pre-wrap font-medium leading-relaxed">{result.body}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// System Health Analyzer (Rule based)
const SystemHealthAnalyzer = () => {
  const [dealInfo, setDealInfo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
        // Hardcoded logic rules based on text length/keywords
        const hasValue = dealInfo.toLowerCase().includes('ล้าน') || dealInfo.toLowerCase().includes('00,000');
        const hasStakeholders = dealInfo.toLowerCase().includes('manager') || dealInfo.toLowerCase().includes('ceo') || dealInfo.toLowerCase().includes('จัดซื้อ');
        
        setAnalysis({
            summary: dealInfo.length > 50 ? "Engagement context identified. Running sector analysis based on input entropy." : "Input volume is insufficient for deep matrix extraction. Increase data density.",
            strengths: hasValue ? ["High yield potential identified", "Clear budget signaling"] : ["Initial contact established"],
            risks: hasStakeholders ? ["Decision chain complexity"] : ["Stakeholder invisibility - critical risk", "Decision maker not identified"],
            winProbability: hasValue && hasStakeholders ? 75 : 30
        });
        setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Field Intelligence Feed</label>
        <Textarea placeholder="Input deal parameters for rule-based risk assessment..." value={dealInfo} onChange={(e) => setDealInfo(e.target.value)} className="min-h-[120px] rounded-[1.8rem] border-slate-200" />
      </div>
      <Button onClick={analyze} disabled={isAnalyzing} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">
        {isAnalyzing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sliders className="mr-2" size={16} />}
        {isAnalyzing ? 'Executing Risk Rules...' : 'Analyze Risk Matrix'}
      </Button>
      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white border-0">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2 pt-2"><CheckCircle size={14} /> Rule Engine Assessment</h4>
            <p className="text-sm font-medium leading-relaxed italic text-slate-300">&quot;{analysis.summary}&quot;</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100">
               <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Positive Correlations</h4>
               <ul className="space-y-2">
                 {analysis.strengths?.map((s, i) => <li key={i} className="text-xs font-bold text-emerald-700 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" /> {s}</li>)}
               </ul>
            </div>
            <div className="p-6 rounded-[2rem] bg-rose-50 border border-rose-100">
               <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Risk Variables</h4>
               <ul className="space-y-2">
                 {analysis.risks?.map((r, i) => <li key={i} className="text-xs font-bold text-rose-700 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-rose-400" /> {r}</li>)}
               </ul>
            </div>
          </div>
          <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Probability Matrix</h4>
               <span className="text-4xl font-black text-slate-900 tabular-nums">{analysis.winProbability}%</span>
             </div>
             <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${analysis.winProbability}%` }} 
                 className={cn("h-full transition-all duration-1000", analysis.winProbability >= 70 ? "bg-emerald-500" : analysis.winProbability >= 40 ? "bg-primary" : "bg-rose-500")} 
               />
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('roi');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1400px] mx-auto space-y-12 pb-20 px-4 md:px-0">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-900 text-white rounded-xl"><FileText size={18} /></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Utility Matrix</p>
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
          Strategic <span className="text-primary italic">Lab</span>
        </h1>
        <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-lg">Advanced deterministic tools for fiscal projection and protocol execution.</p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
        <TabsList className="bg-white border border-slate-100 p-2 rounded-[2rem] inline-flex h-auto gap-2">
          <TabsTrigger value="roi" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">Yield Calculator</TabsTrigger>
          <TabsTrigger value="email" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">Protocol Generator</TabsTrigger>
          <TabsTrigger value="analyze" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">Risk Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="roi" className="mt-0">
          <Card className="p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
               <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Calculator size={28} /></div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Yield Calculator</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Deterministic fiscal return engine</p>
               </div>
            </div>
            <ROICalculator />
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <Card className="p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
               <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Mail size={28} /></div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Protocol Generator</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Rule-based engagement templates</p>
               </div>
            </div>
            <LogicProtocolGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="mt-0">
          <Card className="p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
               <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Sliders size={28} /></div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Risk Matrix Analyzer</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Heuristic deal vector evaluation</p>
               </div>
            </div>
            <SystemHealthAnalyzer />
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
