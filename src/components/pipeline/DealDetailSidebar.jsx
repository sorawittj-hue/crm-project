import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, CheckCircle2, XCircle,
  Phone, Mail,
  Sparkles, Activity, Target, ShieldCheck, Zap
} from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { formatFullCurrency as formatCurrency } from '../../lib/formatters';
import { callGeminiAPI } from '../../services/ai';
import { Card, CardContent } from '../ui/Card';

export default function DealDetailSidebar({ deal, onUpdate, onDelete }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const parseAIResponse = (text) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return null;
    }
  };

  const handleAIAnalysis = useCallback(async () => {
    if (!deal) return;
    setIsAnalyzing(true);
    const prompt = `Analyze this sales deal and provide a high-impact strategy.
    Deal: ${deal.title} at ${deal.company}
    Value: ${formatCurrency(deal.value)}
    Stage: ${deal.stage}
    Probability: ${deal.probability}%

    Return ONLY a JSON object:
    {
      "strategy": "3 bullet points of tactical advice in Thai",
      "risk_level": "low|medium|high",
      "next_step": "One clear action item in Thai",
      "win_likelihood": "0-100 percentage"
    }`;

    const result = await callGeminiAPI(prompt);
    if (result) {
      const parsed = parseAIResponse(result);
      if (parsed) setAiAnalysis(parsed);
    }
    setIsAnalyzing(false);
  }, [deal]);

  useEffect(() => {
    if (deal && deal.value >= 1000000 && !aiAnalysis) {
      handleAIAnalysis();
    }
  }, [deal, aiAnalysis, handleAIAnalysis]);

  if (!deal) return null;

  return (
    <SheetContent className="bg-white border-l border-slate-200 w-full sm:max-w-xl p-0 overflow-y-auto custom-scrollbar">
      <div className="p-8 space-y-10 pb-24">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-primary rounded-full" />
             <SheetTitle className="text-3xl font-black text-slate-900 tracking-tight">
               Deal Details
             </SheetTitle>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <ShieldCheck size={12} className="text-primary" />
             <span>ID: {deal.id.slice(0, 8)} • System Verified</span>
          </div>
        </SheetHeader>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-[2rem] bg-slate-50 border-none">
            <CardContent className="p-5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Value</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{formatCurrency(deal.value)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] bg-slate-50 border-none">
            <CardContent className="p-5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confidence</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black text-slate-900 tabular-nums">{deal.probability}%</p>
                <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${deal.probability}%` }}
                    className="h-full bg-primary" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Actions */}
        <div className="flex items-center gap-3">
          <Button 
            className="flex-1 rounded-full h-12 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={() => onUpdate(deal.id, { stage: 'won' })}
          >
            <CheckCircle2 size={16} className="mr-2" /> Mark as Won
          </Button>
          <Button 
            variant="outline"
            className="flex-1 rounded-full h-12 text-xs font-bold uppercase tracking-widest"
            onClick={() => onUpdate(deal.id, { stage: 'lost' })}
          >
            <XCircle size={16} className="mr-2" /> Mark as Lost
          </Button>
          <Button 
            variant="ghost" 
            className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently delete this deal?')) {
                onDelete(deal.id);
              }
            }}
          >
            <Trash2 size={20} />
          </Button>
        </div>

        {/* AI STRATEGY ENGINE */}
        <Card className="rounded-[2.5rem] border-primary/20 bg-primary/5 border">
           <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                       <Sparkles size={18} />
                    </div>
                    <div>
                       <h3 className="text-xs font-black uppercase tracking-widest text-primary">AI Sales Strategy</h3>
                       <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Intelligent Portfolio Analysis</p>
                    </div>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={handleAIAnalysis}
                   disabled={isAnalyzing}
                   className="text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-full px-4"
                 >
                   {isAnalyzing ? 'Analyzing...' : 'Refresh Strategy'}
                 </Button>
              </div>

              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Consulting Intelligence Nodes...</p>
                  </motion.div>
                ) : aiAnalysis ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-primary/10">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Win Likelihood</p>
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">{aiAnalysis.win_likelihood}%</span>
                       </div>
                       <Badge className={cn("font-bold text-[9px] px-3 py-1 rounded-full",
                          aiAnalysis.risk_level === 'high' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                       )}>
                          {aiAnalysis.risk_level.toUpperCase()} RISK
                       </Badge>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex items-center gap-2">
                          <Target size={14} className="text-primary" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Directives</p>
                       </div>
                       <div className="text-xs leading-relaxed font-bold text-slate-700 bg-white p-5 rounded-3xl border border-slate-100 italic">
                          &quot;{aiAnalysis.strategy}&quot;
                       </div>
                    </div>

                    <div className="pt-6 border-t border-primary/10">
                       <div className="p-4 rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-1">Recommended Next Step</p>
                          <p className="text-sm font-black italic">&quot;{aiAnalysis.next_step}&quot;</p>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-12 text-center">
                     <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Zap size={24} className="text-slate-200" />
                     </div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Insights Available for Review</p>
                  </div>
                )}
              </AnimatePresence>
           </CardContent>
        </Card>

        {/* Deal Configuration */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Activity size={16} className="text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Project Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
              <Input 
                defaultValue={deal.title} 
                onBlur={(e) => onUpdate(deal.id, { title: e.target.value })}
                className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Client / Company</label>
              <Input 
                defaultValue={deal.company} 
                onBlur={(e) => onUpdate(deal.id, { company: e.target.value })}
                className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Deal Value</label>
                <Input 
                  type="number"
                  defaultValue={deal.value} 
                  onBlur={(e) => onUpdate(deal.id, { value: Number(e.target.value) })}
                  className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confidence (%)</label>
                <Input 
                  type="number"
                  defaultValue={deal.probability} 
                  onBlur={(e) => onUpdate(deal.id, { probability: Number(e.target.value) })}
                  className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Hub */}
        <div className="pt-6">
           <Card className="bg-slate-50 border-none rounded-[2.5rem]">
              <CardContent className="p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <Activity size={16} className="text-slate-400" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contact History</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <Button 
                     variant="outline" 
                     className="h-12 bg-white rounded-2xl font-bold uppercase tracking-widest text-[9px]"
                     onClick={() => onUpdate(deal.id, { last_activity: new Date().toISOString() })}
                   >
                     <Phone size={14} className="mr-2" /> Log Call
                   </Button>
                   <Button 
                     variant="outline" 
                     className="h-12 bg-white rounded-2xl font-bold uppercase tracking-widest text-[9px]"
                     onClick={() => onUpdate(deal.id, { last_activity: new Date().toISOString() })}
                   >
                     <Mail size={14} className="mr-2" /> Log Email
                   </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </SheetContent>
  );
}
