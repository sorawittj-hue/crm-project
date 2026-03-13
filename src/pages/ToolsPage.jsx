import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { callGeminiAPI } from '../services/ai';
import {
  HardDrive, Cpu, Zap, Loader2, Calculator, TrendingUp, DollarSign,
  PieChart, BarChart3, Users, Target, Briefcase, Lightbulb,
  Rocket, Award, Clock, CheckCircle, AlertCircle, ArrowRight,
  Mail, FileText, MessageSquare, Share2, Copy, Download
} from 'lucide-react';
import { Textarea } from '../components/ui/Textarea';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);
const formatCompact = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatPercent = (num) => `${(Math.round(num * 100) / 100).toFixed(2)}%`;
const formatNumber = (num) => new Intl.NumberFormat('th-TH').format(num || 0);

// ROI Calculator Component
const ROICalculator = () => {
  const [inputs, setInputs] = useState({
    initialInvestment: '',
    monthlyRevenue: '',
    monthlyCost: '',
    period: '12'
  });
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
    const totalProfit = totalReturn - investment;

    setResults({
      monthlyProfit,
      totalReturn,
      roi,
      paybackPeriod: Math.round(paybackPeriod),
      totalProfit
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Initial Investment</label>
          <Input
            type="number"
            placeholder="500000"
            value={inputs.initialInvestment}
            onChange={(e) => setInputs({ ...inputs, initialInvestment: e.target.value })}
            className="h-12 bg-white/5 border-white/10 rounded-xl font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Monthly Revenue</label>
          <Input
            type="number"
            placeholder="100000"
            value={inputs.monthlyRevenue}
            onChange={(e) => setInputs({ ...inputs, monthlyRevenue: e.target.value })}
            className="h-12 bg-white/5 border-white/10 rounded-xl font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Monthly Cost</label>
          <Input
            type="number"
            placeholder="30000"
            value={inputs.monthlyCost}
            onChange={(e) => setInputs({ ...inputs, monthlyCost: e.target.value })}
            className="h-12 bg-white/5 border-white/10 rounded-xl font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Period (Months)</label>
          <Input
            type="number"
            value={inputs.period}
            onChange={(e) => setInputs({ ...inputs, period: e.target.value })}
            className="h-12 bg-white/5 border-white/10 rounded-xl font-bold"
          />
        </div>
      </div>

      <Button onClick={calculate} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
        <Calculator size={18} className="mr-2" /> Calculate ROI
      </Button>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-5 gap-4 mt-6"
        >
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Monthly Profit</p>
            <p className="text-2xl font-black text-emerald-500">{formatCurrency(results.monthlyProfit)}</p>
          </div>
          <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Total Return</p>
            <p className="text-2xl font-black text-primary">{formatCurrency(results.totalReturn)}</p>
          </div>
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">ROI</p>
            <p className={cn("text-2xl font-black", results.roi >= 0 ? "text-emerald-500" : "text-red-500")}>
              {formatPercent(results.roi / 100)}
            </p>
          </div>
          <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Payback Period</p>
            <p className="text-2xl font-black text-blue-500">{results.paybackPeriod === Infinity ? '∞' : `${results.paybackPeriod} mo`}</p>
          </div>
          <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Net Profit</p>
            <p className={cn("text-2xl font-black", results.totalProfit >= 0 ? "text-emerald-500" : "text-red-500")}>
              {formatCurrency(results.totalProfit)}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Break-even Calculator
const BreakEvenCalculator = () => {
  const [inputs, setInputs] = useState({ fixedCosts: '', pricePerUnit: '', variableCost: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const fixed = Number(inputs.fixedCosts) || 0;
    const price = Number(inputs.pricePerUnit) || 0;
    const variable = Number(inputs.variableCost) || 0;
    const contribution = price - variable;
    const breakEvenUnits = contribution > 0 ? fixed / contribution : 0;
    const breakEvenRevenue = breakEvenUnits * price;

    setResults({ breakEvenUnits: Math.ceil(breakEvenUnits), breakEvenRevenue, contribution });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Fixed Costs</label>
          <Input type="number" placeholder="100000" value={inputs.fixedCosts} onChange={(e) => setInputs({ ...inputs, fixedCosts: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Price per Unit</label>
          <Input type="number" placeholder="1000" value={inputs.pricePerUnit} onChange={(e) => setInputs({ ...inputs, pricePerUnit: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Variable Cost/Unit</label>
          <Input type="number" placeholder="500" value={inputs.variableCost} onChange={(e) => setInputs({ ...inputs, variableCost: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
      </div>

      <Button onClick={calculate} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
        <Target size={18} className="mr-2" /> Calculate Break-Even
      </Button>

      {results && (
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Break-Even Units</p>
            <p className="text-3xl font-black text-amber-500">{formatNumber(results.breakEvenUnits)}</p>
          </div>
          <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Break-Even Revenue</p>
            <p className="text-2xl font-black text-primary">{formatCurrency(results.breakEvenRevenue)}</p>
          </div>
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Contribution Margin</p>
            <p className="text-2xl font-black text-emerald-500">{formatCurrency(results.contribution)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Commission Calculator
const CommissionCalculator = () => {
  const [inputs, setInputs] = useState({ salesAmount: '', commissionRate: '', baseSalary: '', target: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const sales = Number(inputs.salesAmount) || 0;
    const rate = (Number(inputs.commissionRate) || 0) / 100;
    const base = Number(inputs.baseSalary) || 0;
    const target = Number(inputs.target) || 0;

    const commission = sales * rate;
    const total = base + commission;
    const attainment = target > 0 ? (sales / target) * 100 : 0;
    const effectiveRate = sales > 0 ? (commission / sales) * 100 : 0;

    setResults({ commission, total, attainment, effectiveRate });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Sales Amount</label>
          <Input type="number" placeholder="1000000" value={inputs.salesAmount} onChange={(e) => setInputs({ ...inputs, salesAmount: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Commission Rate %</label>
          <Input type="number" placeholder="5" value={inputs.commissionRate} onChange={(e) => setInputs({ ...inputs, commissionRate: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Base Salary</label>
          <Input type="number" placeholder="30000" value={inputs.baseSalary} onChange={(e) => setInputs({ ...inputs, baseSalary: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Target</label>
          <Input type="number" placeholder="2000000" value={inputs.target} onChange={(e) => setInputs({ ...inputs, target: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
      </div>

      <Button onClick={calculate} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
        <DollarSign size={18} className="mr-2" /> Calculate Commission
      </Button>

      {results && (
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Commission</p>
            <p className="text-2xl font-black text-primary">{formatCurrency(results.commission)}</p>
          </div>
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Total Pay</p>
            <p className="text-2xl font-black text-emerald-500">{formatCurrency(results.total)}</p>
          </div>
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Target Attainment</p>
            <p className="text-2xl font-black text-amber-500">{formatPercent(results.attainment / 100)}</p>
          </div>
          <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Effective Rate</p>
            <p className="text-2xl font-black text-blue-500">{formatPercent(results.effectiveRate / 100)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// AI Email Generator
const AIEmailGenerator = () => {
  const [inputs, setInputs] = useState({
    type: 'follow_up',
    recipient: '',
    context: '',
    tone: 'professional'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setIsGenerating(true);
    const prompt = `Generate a ${inputs.tone} business email for: ${inputs.type}
    Recipient: ${inputs.recipient}
    Context: ${inputs.context}
    
    Return ONLY JSON: { "subject": "email subject", "body": "email body in Thai" }`;

    try {
      const res = await callGeminiAPI(prompt);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(`${result.subject}\n\n${result.body}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Email Type</label>
          <select
            value={inputs.type}
            onChange={(e) => setInputs({ ...inputs, type: e.target.value })}
            className="h-12 w-full bg-white/5 border-white/10 rounded-xl font-bold text-sm px-4"
          >
            <option value="follow_up">Follow-up After Meeting</option>
            <option value="proposal">Proposal Submission</option>
            <option value="cold_outreach">Cold Outreach</option>
            <option value="thank_you">Thank You</option>
            <option value="negotiation">Price Negotiation</option>
            <option value="closing">Closing Deal</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Tone</label>
          <select
            value={inputs.tone}
            onChange={(e) => setInputs({ ...inputs, tone: e.target.value })}
            className="h-12 w-full bg-white/5 border-white/10 rounded-xl font-bold text-sm px-4"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="persuasive">Persuasive</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Recipient Name/Company</label>
        <Input
          placeholder="e.g. John Doe at Acme Corp"
          value={inputs.recipient}
          onChange={(e) => setInputs({ ...inputs, recipient: e.target.value })}
          className="h-12 bg-white/5 border-white/10 rounded-xl font-bold"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Context & Key Points</label>
        <Textarea
          placeholder="Describe the purpose, key discussion points, call-to-action, etc."
          value={inputs.context}
          onChange={(e) => setInputs({ ...inputs, context: e.target.value })}
          className="min-h-[120px] bg-white/5 border-white/10 rounded-xl font-bold resize-none"
        />
      </div>

      <Button onClick={generate} disabled={isGenerating} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
        {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2" />}
        {isGenerating ? 'Generating...' : 'Generate Email with AI'}
      </Button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-widest">Generated Email</h4>
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
              <Copy size={14} className="mr-2" /> Copy
            </Button>
          </div>
          <div className="p-4 bg-black/40 rounded-xl">
            <p className="text-xs font-bold text-muted-foreground mb-2">Subject:</p>
            <p className="text-sm font-black mb-4">{result.subject}</p>
            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{result.body}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// AI Deal Analyzer
const AIDealAnalyzer = () => {
  const [dealInfo, setDealInfo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyze = async () => {
    setIsAnalyzing(true);
    const prompt = `Analyze this sales deal and provide strategic advice:
    ${dealInfo}
    
    Return ONLY JSON: {
      "strengths": ["point1", "point2"],
      "risks": ["risk1", "risk2"],
      "recommendations": ["rec1", "rec2", "rec3"],
      "winProbability": 0-100,
      "summary": "brief summary in Thai"
    }`;

    try {
      const res = await callGeminiAPI(prompt);
      setAnalysis(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Deal Information</label>
        <Textarea
          placeholder="Describe the deal: company, value, stage, key stakeholders, competition, timeline, challenges, etc."
          value={dealInfo}
          onChange={(e) => setDealInfo(e.target.value)}
          className="min-h-[150px] bg-white/5 border-white/10 rounded-xl font-bold resize-none"
        />
      </div>

      <Button onClick={analyze} disabled={isAnalyzing} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
        {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <Brain className="mr-2" />}
        {isAnalyzing ? 'Analyzing...' : 'Analyze Deal with AI'}
      </Button>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-5 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Brain size={20} className="text-primary" />
              <h4 className="text-sm font-black uppercase tracking-widest">AI Assessment</h4>
            </div>
            <p className="text-sm font-medium leading-relaxed">{analysis.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">Strengths</h4>
              </div>
              <ul className="space-y-2">
                {analysis.strengths?.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-red-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Risks</h4>
              </div>
              <ul className="space-y-2">
                {analysis.risks?.map((r, i) => (
                  <li key={i} className="text-xs flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">Strategic Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {analysis.recommendations?.map((r, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <span className="text-amber-500 font-black mr-2">{i + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {analysis.winProbability !== undefined && (
            <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-widest">Win Probability</h4>
                <span className={cn(
                  "text-3xl font-black",
                  analysis.winProbability >= 70 ? "text-emerald-500" :
                  analysis.winProbability >= 40 ? "text-amber-500" : "text-red-500"
                )}>
                  {analysis.winProbability}%
                </span>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.winProbability}%` }}
                  transition={{ duration: 1 }}
                  className={cn(
                    "h-full rounded-full",
                    analysis.winProbability >= 70 ? "bg-emerald-500" :
                    analysis.winProbability >= 40 ? "bg-amber-500" : "bg-red-500"
                  )}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Main ToolsPage
export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('calculators');

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-10 animate-fade-up">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-2xl shadow-primary/30">
            <Rocket size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Business Tools</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Calculators • AI Assistants • Productivity Suite</p>
          </div>
        </div>
      </header>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-black/40 border border-white/10 rounded-2xl p-1.5">
          <TabsTrigger value="calculators" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
            <Calculator size={16} className="mr-2" /> Calculators
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
            <Mail size={16} className="mr-2" /> AI Email
          </TabsTrigger>
          <TabsTrigger value="analyzer" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
            <Brain size={16} className="mr-2" /> Deal Analyzer
          </TabsTrigger>
          <TabsTrigger value="it" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
            <Cpu size={16} className="mr-2" /> IT Tools
          </TabsTrigger>
        </TabsList>

        {/* CALCULATORS TAB */}
        <TabsContent value="calculators" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3 bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" /> ROI Calculator
                </CardTitle>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Calculate return on investment and payback period</p>
              </CardHeader>
              <CardContent className="p-0">
                <ROICalculator />
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Target size={18} className="text-amber-500" /> Break-Even Analysis
                </CardTitle>
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Find your break-even point</p>
              </CardHeader>
              <CardContent className="p-0">
                <BreakEvenCalculator />
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={18} className="text-blue-500" /> Commission Calculator
                </CardTitle>
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Calculate sales commissions</p>
              </CardHeader>
              <CardContent className="p-0">
                <CommissionCalculator />
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <PieChart size={18} className="text-purple-500" /> Margin Calculator
                </CardTitle>
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Profit margin calculations</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-white/5 rounded-xl text-center text-muted-foreground">
                  <p className="text-sm font-black uppercase">Coming Soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI EMAIL TAB */}
        <TabsContent value="email" className="mt-6">
          <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Mail size={20} className="text-primary" /> AI Email Generator
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Generate professional emails in seconds</p>
            </CardHeader>
            <CardContent className="p-0">
              <AIEmailGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEAL ANALYZER TAB */}
        <TabsContent value="analyzer" className="mt-6">
          <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Brain size={20} className="text-purple-500" /> AI Deal Analyzer
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Get strategic insights for your deals</p>
            </CardHeader>
            <CardContent className="p-0">
              <AIDealAnalyzer />
            </CardContent>
          </Card>
        </TabsContent>

        {/* IT TOOLS TAB */}
        <TabsContent value="it" className="mt-6 space-y-6">
          <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <HardDrive size={20} className="text-primary" /> RAID Calculator
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Calculate RAID array capacity and fault tolerance</p>
            </CardHeader>
            <CardContent className="p-0">
              <RAIDCalculator />
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Cpu size={20} className="text-emerald-500" /> AI CPU Comparison
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Compare processors with AI assistance</p>
            </CardHeader>
            <CardContent className="p-0">
              <CPUComparison />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// RAID Calculator Component
const RAIDCalculator = () => {
  const [config, setConfig] = useState({ size: 4, count: 4, level: '5', unit: 'TB' });
  const [result, setResult] = useState(null);

  const calculate = () => {
    const s = Number(config.size);
    const n = Number(config.count);
    let capacity = 0, tolerance = 0;

    if (config.level === '0') { capacity = s * n; tolerance = 0; }
    else if (config.level === '1') { capacity = s; tolerance = n - 1; }
    else if (config.level === '5') { capacity = s * (n - 1); tolerance = 1; }
    else if (config.level === '6') { capacity = s * (n - 2); tolerance = 2; }
    else if (config.level === '10') { capacity = (s * n) / 2; tolerance = n / 2; }

    setResult({ capacity, tolerance });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Disk Size</label>
          <Input type="number" value={config.size} onChange={(e) => setConfig({ ...config, size: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Disk Count</label>
          <Input type="number" value={config.count} onChange={(e) => setConfig({ ...config, count: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">RAID Level</label>
          <select value={config.level} onChange={(e) => setConfig({ ...config, level: e.target.value })} className="h-12 w-full bg-white/5 border-white/10 rounded-xl font-bold text-sm px-4">
            <option value="0">RAID 0</option>
            <option value="1">RAID 1</option>
            <option value="5">RAID 5</option>
            <option value="6">RAID 6</option>
            <option value="10">RAID 10</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button onClick={calculate} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Calculate</Button>
        </div>
      </div>

      {result && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Usable Capacity</p>
            <p className="text-3xl font-black text-primary">{result.capacity} {config.unit}</p>
          </div>
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Fault Tolerance</p>
            <p className="text-3xl font-black text-emerald-500">{result.tolerance} Disk(s)</p>
          </div>
        </div>
      )}
    </div>
  );
};

// CPU Comparison Component
const CPUComparison = () => {
  const [cpus, setCpus] = useState({ a: '', b: '' });
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState(null);

  const compare = async () => {
    setIsComparing(true);
    const prompt = `Compare these CPUs: "${cpus.a}" vs "${cpus.b}". Return ONLY JSON: { "cpuA": { "model": "", "cores": "", "clock": "", "tdp": "", "score": 0 }, "cpuB": { "model": "", "cores": "", "clock": "", "tdp": "", "score": 0 }, "winner": "cpuA or cpuB", "reason": "" }`;

    try {
      const res = await callGeminiAPI(prompt);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Input placeholder="CPU A (e.g. Intel i9-14900K)" value={cpus.a} onChange={(e) => setCpus({ ...cpus, a: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
        <Input placeholder="CPU B (e.g. AMD Ryzen 9 7950X)" value={cpus.b} onChange={(e) => setCpus({ ...cpus, b: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold" />
      </div>

      <Button onClick={compare} disabled={isComparing} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
        {isComparing ? <Loader2 className="animate-spin mr-2" /> : <Cpu className="mr-2" />}
        {isComparing ? 'Comparing...' : 'Compare with AI'}
      </Button>

      {result && (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {[result.cpuA, result.cpuB].map((cpu, i) => (
            <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <h4 className="text-lg font-black text-primary mb-4">{cpu.model}</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-black/40 rounded-xl text-center">
                  <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Cores</p>
                  <p className="text-lg font-black">{cpu.cores}</p>
                </div>
                <div className="p-3 bg-black/40 rounded-xl text-center">
                  <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Clock</p>
                  <p className="text-lg font-black">{cpu.clock}</p>
                </div>
                <div className="p-3 bg-black/40 rounded-xl text-center">
                  <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">TDP</p>
                  <p className="text-lg font-black">{cpu.tdp}</p>
                </div>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Performance Score</p>
                <p className="text-2xl font-black text-primary">{cpu.score}</p>
              </div>
            </div>
          ))}
          <div className="md:col-span-2 p-5 bg-gradient-to-r from-emerald-500/20 to-primary/20 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Award size={20} className="text-emerald-500" />
              <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">Winner: {result.winner === 'cpuA' ? result.cpuA.model : result.cpuB.model}</h4>
            </div>
            <p className="text-sm font-medium">{result.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Brain icon since it's not in lucide-react v0.303
const Brain = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1 1.967-.5" />
    <path d="M16.033 17.5A4 4 0 0 1 18 18" />
  </svg>
);
