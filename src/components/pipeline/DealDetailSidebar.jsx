import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Trash2, CheckCircle2, XCircle,
  ChevronRight,
  Briefcase, Phone, Mail,
  Sparkles, Activity, Target, ShieldCheck, Zap, Cpu
} from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { callGeminiAPI } from '../../services/ai';
import { Card, CardContent } from '../ui/Card';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

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
    <SheetContent className="glass-card border-l border-border/40 w-full sm:max-w-xl p-0 overflow-y-auto custom-scrollbar">
      <div className="p-8 space-y-10 pb-24">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-primary rounded-full" />
             <SheetTitle className="text-3xl font-black uppercase tracking-tighter italic premium-gradient-text">
               Signal Detailed
             </SheetTitle>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
             <ShieldCheck size={12} className="text-primary" />
             <span>ID: {deal.id.slice(0, 8)} • Sector Synchronization Active</span>
          </div>
        </SheetHeader>

        {/* HUD Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="premium-card bg-muted/20">
            <CardContent className="p-4">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 leading-none">Capital Asset</p>
              <p className="text-2xl font-black tabular-nums tracking-tighter leading-none">{formatCurrency(deal.value)}</p>
            </CardContent>
          </Card>
          <Card className="premium-card bg-muted/20">
            <CardContent className="p-4">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 leading-none">Yield Matrix</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black tabular-nums tracking-tighter leading-none">{deal.probability}%</p>
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden border border-white/5">
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

        {/* Action HUD */}
        <div className="flex items-center gap-3">
          <Button 
            className="flex-1 btn-zenith-primary h-12 text-[10px]"
            onClick={() => onUpdate(deal.id, { stage: 'won' })}
          >
            <CheckCircle2 size={16} className="mr-2" /> Commit to Victory
          </Button>
          <Button 
            variant="ghost"
            className="flex-1 btn-zenith-outline h-12 text-[10px]"
            onClick={() => onUpdate(deal.id, { stage: 'lost' })}
          >
            <XCircle size={16} className="mr-2" /> Scrap Signal
          </Button>
          <Button 
            variant="ghost" 
            className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 transition-all"
            onClick={() => {
              if (window.confirm('Erase this signal from the matrix permanently?')) {
                onDelete(deal.id);
              }
            }}
          >
            <Trash2 size={20} />
          </Button>
        </div>

        {/* AI TACTICAL ENGINE */}
        <Card className="relative overflow-hidden border-primary/20 bg-primary/[0.02]">
           <div className="absolute top-0 right-0 p-2">
              <Zap size={40} className="text-primary opacity-5" />
           </div>
           <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                       <Sparkles size={20} />
                    </div>
                    <div>
                       <h3 className="text-xs font-black uppercase tracking-[0.2em] leading-none mb-1 text-primary">Neural Strategy</h3>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Planetary Intel Analysis</p>
                    </div>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={handleAIAnalysis}
                   disabled={isAnalyzing}
                   className="text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20 rounded-xl px-4"
                 >
                   {isAnalyzing ? 'Scanning...' : 'Recalibrate'}
                 </Button>
              </div>

              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center justify-center gap-6"
                  >
                    <div className="relative">
                       <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full"
                       />
                       <Activity size={24} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-reveal">Accessing Global Node Matrix</p>
                       <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2">Correlating market variables...</p>
                    </div>
                  </motion.div>
                ) : aiAnalysis ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-border/40">
                       <div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Success Probability</p>
                          <span className="text-4xl font-black tabular-nums">{aiAnalysis.win_likelihood}%</span>
                       </div>
                       <Badge className={cn(
                          "font-black text-[9px] px-3 py-1 rounded-xl shadow-lg",
                          aiAnalysis.risk_level === 'high' ? 'bg-destructive/20 text-destructive border-destructive/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                       )}>
                          {aiAnalysis.risk_level.toUpperCase()} THREAT LEVEL
                       </Badge>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                          <Target size={14} className="text-primary" />
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tactical Directives</p>
                       </div>
                       <p className="text-xs leading-relaxed font-bold border-l-2 border-primary/40 pl-4 py-1 italic opacity-90">{aiAnalysis.strategy}</p>
                    </div>

                    <div className="pt-6 border-t border-border/40">
                       <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 group cursor-pointer hover:bg-primary/20 transition-all">
                          <div>
                             <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Recommended Sequence</p>
                             <p className="text-sm font-black italic">&quot;{aiAnalysis.next_step}&quot;</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:translate-x-1 transition-transform">
                             <ChevronRight size={20} />
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-12 text-center">
                     <div className="w-16 h-16 rounded-[2rem] bg-muted/30 flex items-center justify-center mx-auto mb-4 border border-border/40">
                        <ShieldCheck size={32} className="text-muted-foreground opacity-20" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Diagnostics Pending</p>
                  </div>
                )}
              </AnimatePresence>
           </CardContent>
        </Card>

        {/* Intelligence Data Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <Cpu size={16} className="text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Signal Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mission Objective</label>
              <Input 
                defaultValue={deal.title} 
                onBlur={(e) => onUpdate(deal.id, { title: e.target.value })}
                className="input-field h-12 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Target Entity</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  defaultValue={deal.company} 
                  onBlur={(e) => onUpdate(deal.id, { company: e.target.value })}
                  className="input-field pl-12 h-12 bg-background/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Asset Value</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    type="number"
                    defaultValue={deal.value} 
                    onBlur={(e) => onUpdate(deal.id, { value: Number(e.target.value) })}
                    className="input-field pl-12 h-12 bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confidence Rating</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    type="number"
                    defaultValue={deal.probability} 
                    onBlur={(e) => onUpdate(deal.id, { probability: Number(e.target.value) })}
                    className="input-field pl-12 h-12 bg-background/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transmission Node */}
        <div className="pt-6">
           <Card className="bg-muted/30 border-border/40 rounded-[2rem]">
              <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-6">
                    <Activity size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Transmission Hub</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <Button 
                     variant="ghost" 
                     className="h-12 border border-border/40 bg-background/40 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all"
                     onClick={() => onUpdate(deal.id, { lastActivity: new Date().toISOString() })}
                   >
                     <Phone size={14} className="mr-2" /> Voice Comms
                   </Button>
                   <Button 
                     variant="ghost" 
                     className="h-12 border border-border/40 bg-background/40 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all"
                     onClick={() => onUpdate(deal.id, { lastActivity: new Date().toISOString() })}
                   >
                     <Mail size={14} className="mr-2" /> Digital Intel
                   </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </SheetContent>
  );
}
