import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Trash2, CheckCircle2, XCircle,
  ChevronRight,
  Briefcase, Phone, Mail,
  Sparkles, Activity, Target
} from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { callGeminiAPI } from '../../services/ai';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);

export default function DealDetailSidebar({ deal, open, onOpenChange, onUpdate, onDelete }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const handleAIAnalysis = async () => {
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
    if (result) setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (deal && open && deal.value >= 1000000) {
      const autoAnalyze = async () => {
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
        if (result) setAiAnalysis(result);
        setIsAnalyzing(false);
      };
      autoAnalyze();
    }
  }, [deal?.id, deal?.value, deal?.title, deal?.company, deal?.stage, deal?.probability, open]);

  if (!deal) return null;

  return (
    <Sheet 
      open={open} 
      onOpenChange={onOpenChange}
      title={deal.title}
      description={`${deal.company} • ${deal.stage}`}
    >
      <div className="space-y-8 pb-20">
        {/* HUD Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Contract Value</p>
            <p className="text-xl font-black tabular-nums tracking-tighter">{formatCurrency(deal.value)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Win Probability</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-black tabular-nums tracking-tighter">{deal.probability}%</p>
              <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${deal.probability}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action HUD */}
        <div className="flex items-center gap-2">
          <Button 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] h-11 rounded-xl"
            onClick={() => onUpdate(deal.id, { stage: 'won' })}
          >
            <CheckCircle2 size={16} className="mr-2" /> Mark as Won
          </Button>
          <Button 
            variant="outline"
            className="flex-1 border-white/10 bg-white/5 font-black uppercase tracking-widest text-[10px] h-11 rounded-xl"
            onClick={() => onUpdate(deal.id, { stage: 'lost' })}
          >
            <XCircle size={16} className="mr-2" /> Mark as Lost
          </Button>
          <Button 
            variant="ghost" 
            className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
            onClick={() => {
              if (confirm('Delete this signal?')) {
                onDelete(deal.id);
                onOpenChange(false);
              }
            }}
          >
            <Trash2 size={18} />
          </Button>
        </div>

        {/* AI STRATEGY ENGINE */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-3xl blur-xl opacity-50" />
          <div className="relative p-6 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles size={18} className="text-primary" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">AI Tactical Engine</h3>
              </div>
              <Button 
                variant="ghost" 
                size="xs" 
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
                className="text-[9px] font-black uppercase tracking-widest text-primary underline"
              >
                {isAnalyzing ? 'Processing...' : 'Run Diagnostics'}
              </Button>
            </div>

            {isAnalyzing ? (
              <div className="py-8 flex flex-col items-center justify-center gap-4 opacity-50">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={32} className="text-primary" />
                </motion.div>
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Scanning market signals...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6 animate-fade-up">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">Target Likelihood</p>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black tabular-nums">{aiAnalysis.win_likelihood}%</span>
                    <Badge className={cn(
                      "font-black text-[9px] px-2 py-0.5 rounded-md",
                      aiAnalysis.risk_level === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {aiAnalysis.risk_level.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tactical Strategy</p>
                  <p className="text-xs leading-relaxed font-bold opacity-90 whitespace-pre-wrap">{aiAnalysis.strategy}</p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Next Best Action</p>
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-xs font-black">{aiAnalysis.next_step}</p>
                    <ChevronRight size={16} className="text-primary" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs font-bold text-muted-foreground opacity-50">Awaiting tactical diagnostic request.</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Matrix */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Signal Data Matrix</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Opportunity Title</label>
              <Input 
                defaultValue={deal.title} 
                onBlur={(e) => onUpdate(deal.id, { title: e.target.value })}
                className="bg-white/5 border-white/5 h-11 font-bold text-xs rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Entity Name</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input 
                  defaultValue={deal.company} 
                  onBlur={(e) => onUpdate(deal.id, { company: e.target.value })}
                  className="pl-10 bg-white/5 border-white/5 h-11 font-bold text-xs rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Deal Value</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input 
                    type="number"
                    defaultValue={deal.value} 
                    onBlur={(e) => onUpdate(deal.id, { value: Number(e.target.value) })}
                    className="pl-10 bg-white/5 border-white/5 h-11 font-bold text-xs rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Win Probability</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input 
                    type="number"
                    defaultValue={deal.probability} 
                    onBlur={(e) => onUpdate(deal.id, { probability: Number(e.target.value) })}
                    className="pl-10 bg-white/5 border-white/5 h-11 font-bold text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Node */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Communication Node</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="h-10 border-white/5 bg-white/5 font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-primary hover:text-white transition-all"
              onClick={() => onUpdate(deal.id, { lastActivity: new Date().toISOString() })}
            >
              <Phone size={14} className="mr-2" /> Call Target
            </Button>
            <Button 
              variant="outline" 
              className="h-10 border-white/5 bg-white/5 font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-blue-500 hover:text-white transition-all"
              onClick={() => onUpdate(deal.id, { lastActivity: new Date().toISOString() })}
            >
              <Mail size={14} className="mr-2" /> Send Intel
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
