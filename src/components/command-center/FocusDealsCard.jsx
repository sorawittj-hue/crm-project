import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, Loader2, Info } from 'lucide-react';
import { formatCurrency, daysSince } from '../../lib/formatters';
import { callGeminiAPI } from "../../services/ai";
import { cn } from "../../lib/utils";

export default function FocusDealsCard({ focusDeals, onOpenDeal }) {
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({});

  if (!focusDeals || focusDeals.length === 0) return null;

  const handleExplain = async (e, deal) => {
    e.stopPropagation();
    if (explanations[deal.id]) return;
    
    setExplainingId(deal.id);
    try {
      const prompt = `Analyze this CRM deal and provide a 1-2 sentence concise explanation of why it requires immediate focus. 
      Deal context: 
      Title: ${deal.title}
      Stage: ${deal.stage}
      Value: ${deal.value}
      Probability: ${deal.probability}%
      Days Inactive: ${daysSince(deal.last_activity || deal.created_at)} days
      Focus Score: ${deal.focusScore}
      
      Explain in Thai language. Be concise and professional.`;
      
      const response = await callGeminiAPI(prompt, null);
      if (response?.disabled) {
        setExplanations(prev => ({ ...prev, [deal.id]: { disabled: true, text: 'ฟีเจอร์ AI ปิดใช้งานชั่วคราว — จะกลับมาเร็วๆนี้' } }));
        return;
      }
      const explanationText = typeof response === 'string' ? response : (response?.text || 'ไม่สามารถวิเคราะห์ได้');
      setExplanations(prev => ({ ...prev, [deal.id]: { disabled: false, text: explanationText } }));
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      setExplanations(prev => ({ ...prev, [deal.id]: { disabled: false, text: 'ไม่สามารถดึงข้อมูล AI ได้ในขณะนี้' } }));
    } finally {
      setExplainingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
          <Target size={18} className="text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">Top Focus Deals</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">ดีลที่ควรโฟกัสวันนี้ (ประเมินจากมูลค่า โอกาส และความเคลื่อนไหว)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {focusDeals.map((deal, i) => (
          <motion.div 
            key={deal.id} 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex flex-col rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group",
              "bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-sm",
              "hover:-translate-y-1 hover:border-violet-400 dark:hover:border-violet-500/50 hover:shadow-lg dark:hover:shadow-violet-950/30"
            )}
            onClick={() => onOpenDeal(deal)}
          >
            <div className="p-4 flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/20 px-2 py-0.5 rounded-md border border-violet-200 dark:border-violet-500/30">
                  Score: {Math.round(deal.focusScore).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{deal.stage}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                {deal.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{deal.company}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-2 border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">มูลค่า</p>
                  <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">{formatCurrency(deal.value)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-2 border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">นิ่งมาแล้ว</p>
                  <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {daysSince(deal.last_activity || deal.created_at)} วัน
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-4 pb-4">
              <AnimatePresence mode="wait">
                {explanations[deal.id] ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={cn(
                      "p-3 rounded-xl border relative text-xs leading-relaxed font-medium pr-6",
                      explanations[deal.id].disabled 
                        ? "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-500" 
                        : "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/50 text-violet-900 dark:text-violet-200"
                    )}
                  >
                    {explanations[deal.id].disabled ? (
                      <Info size={14} className="text-slate-400 absolute top-3 right-3" />
                    ) : (
                      <Sparkles size={14} className="text-violet-500 absolute top-3 right-3" />
                    )}
                    <p>{explanations[deal.id].text}</p>
                  </motion.div>
                ) : (
                  <button
                    onClick={(e) => handleExplain(e, deal)}
                    disabled={explainingId === deal.id}
                    className="w-full py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 dark:hover:text-violet-300 hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {explainingId === deal.id ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        กำลังวิเคราะห์...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        AI วิเคราะห์ความสำคัญ
                      </>
                    )}
                  </button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
