import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  Calculator, Mail, Brain,
  CheckCircle, AlertCircle, Loader2, Copy
} from 'lucide-react';
import { Textarea } from '../components/ui/Textarea';
import { callGeminiAPI } from '../services/ai';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);
const formatPercent = (num) => `${(Math.round(num * 100) / 100).toFixed(0)}%`;

// ROI Calculator
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
          <label className="text-xs font-medium text-muted-foreground">Initial Investment</label>
          <Input type="number" placeholder="500000" value={inputs.initialInvestment} onChange={(e) => setInputs({ ...inputs, initialInvestment: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Monthly Revenue</label>
          <Input type="number" placeholder="100000" value={inputs.monthlyRevenue} onChange={(e) => setInputs({ ...inputs, monthlyRevenue: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Monthly Cost</label>
          <Input type="number" placeholder="30000" value={inputs.monthlyCost} onChange={(e) => setInputs({ ...inputs, monthlyCost: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Period (Months)</label>
          <Input type="number" value={inputs.period} onChange={(e) => setInputs({ ...inputs, period: e.target.value })} />
        </div>
      </div>

      <Button onClick={calculate} className="w-full">Calculate ROI</Button>

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <p className="text-xs font-medium text-muted-foreground mb-1">Monthly Profit</p>
            <p className="text-xl font-bold text-success">{formatCurrency(results.monthlyProfit)}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Return</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(results.totalReturn)}</p>
          </div>
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <p className="text-xs font-medium text-muted-foreground mb-1">ROI</p>
            <p className={cn("text-xl font-bold", results.roi >= 0 ? "text-success" : "text-destructive")}>{formatPercent(results.roi / 100)}</p>
          </div>
          <div className="p-4 rounded-xl bg-info/10 border border-info/20">
            <p className="text-xs font-medium text-muted-foreground mb-1">Payback Period</p>
            <p className="text-xl font-bold text-info">{results.paybackPeriod === Infinity ? '∞' : `${results.paybackPeriod} mo`}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// AI Email Generator
const AIEmailGenerator = () => {
  const [inputs, setInputs] = useState({ type: 'follow_up', recipient: '', context: '', tone: 'professional' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setIsGenerating(true);
    const prompt = `Generate a ${inputs.tone} business email for: ${inputs.type}. Recipient: ${inputs.recipient}. Context: ${inputs.context}. Return ONLY JSON: { "subject": "email subject", "body": "email body in Thai" }`;
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
    if (result) navigator.clipboard.writeText(`${result.subject}\n\n${result.body}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Email Type</label>
          <select value={inputs.type} onChange={(e) => setInputs({ ...inputs, type: e.target.value })} className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm">
            <option value="follow_up">Follow-up</option>
            <option value="proposal">Proposal</option>
            <option value="cold_outreach">Cold Outreach</option>
            <option value="thank_you">Thank You</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Tone</label>
          <select value={inputs.tone} onChange={(e) => setInputs({ ...inputs, tone: e.target.value })} className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm">
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="persuasive">Persuasive</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Recipient</label>
        <Input placeholder="Company or person name" value={inputs.recipient} onChange={(e) => setInputs({ ...inputs, recipient: e.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Context</label>
        <Textarea placeholder="Describe the purpose and key points" value={inputs.context} onChange={(e) => setInputs({ ...inputs, context: e.target.value })} className="min-h-[100px]" />
      </div>
      <Button onClick={generate} disabled={isGenerating} className="w-full">
        {isGenerating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Mail className="mr-2" size={16} />}
        {isGenerating ? 'Generating...' : 'Generate Email'}
      </Button>
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Generated Email</h4>
            <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy size={14} className="mr-2" /> Copy</Button>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Subject:</p>
            <p className="text-sm font-semibold mb-3">{result.subject}</p>
            <p className="text-sm whitespace-pre-wrap">{result.body}</p>
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
    const prompt = `Analyze this sales deal: ${dealInfo}. Return ONLY JSON: { "strengths": ["point1"], "risks": ["risk1"], "recommendations": ["rec1"], "winProbability": 0-100, "summary": "brief summary" }`;
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
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Deal Information</label>
        <Textarea placeholder="Describe the deal: company, value, stage, stakeholders, challenges..." value={dealInfo} onChange={(e) => setDealInfo(e.target.value)} className="min-h-[120px]" />
      </div>
      <Button onClick={analyze} disabled={isAnalyzing} className="w-full">
        {isAnalyzing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Brain className="mr-2" size={16} />}
        {isAnalyzing ? 'Analyzing...' : 'Analyze Deal'}
      </Button>
      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={18} className="text-primary" />
              <h4 className="text-sm font-semibold">AI Assessment</h4>
            </div>
            <p className="text-sm">{analysis.summary}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-success" />
                <h4 className="text-xs font-semibold text-success">Strengths</h4>
              </div>
              <ul className="space-y-1">
                {analysis.strengths?.map((s, i) => <li key={i} className="text-sm">• {s}</li>)}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-destructive" />
                <h4 className="text-xs font-semibold text-destructive">Risks</h4>
              </div>
              <ul className="space-y-1">
                {analysis.risks?.map((r, i) => <li key={i} className="text-sm">• {r}</li>)}
              </ul>
            </div>
          </div>
          {analysis.winProbability !== undefined && (
            <div className="p-4 rounded-xl bg-info/10 border border-info/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Win Probability</h4>
                <span className="text-2xl font-bold text-info">{analysis.winProbability}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.winProbability}%` }} className={cn("h-full rounded-full", analysis.winProbability >= 70 ? "bg-success" : analysis.winProbability >= 40 ? "bg-warning" : "bg-destructive")} />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('roi');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Tools</h1>
        <p className="text-sm text-muted-foreground">Calculators and AI assistants to boost your productivity</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="roi" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">ROI Calculator</TabsTrigger>
          <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">AI Email</TabsTrigger>
          <TabsTrigger value="analyze" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">AI Deal</TabsTrigger>
        </TabsList>

        <TabsContent value="roi" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calculator size={20} />
                </div>
                <div>
                  <CardTitle>ROI Calculator</CardTitle>
                  <p className="text-sm text-muted-foreground">Calculate return on investment</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ROICalculator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail size={20} />
                </div>
                <div>
                  <CardTitle>AI Email Generator</CardTitle>
                  <p className="text-sm text-muted-foreground">Generate professional emails instantly</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AIEmailGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Brain size={20} />
                </div>
                <div>
                  <CardTitle>AI Deal Analyzer</CardTitle>
                  <p className="text-sm text-muted-foreground">Get strategic insights on your deals</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AIDealAnalyzer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
