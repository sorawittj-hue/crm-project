import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency, daysSince } from '../../lib/formatters';
import { callGeminiAPI } from "../../services/ai";

export default function FocusDealsCard({ focusDeals, onOpenDeal }) {
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({});

  if (!focusDeals || focusDeals.length === 0) return null;

  const handleExplain = async (e, deal) => {
    e.stopPropagation();
    if (explanations[deal.id]) {
      return;
    }
    
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
      const explanationText = typeof response === 'string' ? response : (response?.text || 'ไม่สามารถวิเคราะห์ได้');
      setExplanations(prev => ({ ...prev, [deal.id]: explanationText }));
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      setExplanations(prev => ({ ...prev, [deal.id]: 'ไม่สามารถดึงข้อมูล AI ได้ในขณะนี้' }));
    } finally {
      setExplainingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
          <Target size={18} className="text-violet-600" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Focus Deals</h3>
          <p className="text-xs text-slate-400 font-medium">ดีลที่ควรโฟกัสวันนี้ (ประเมินจากมูลค่า โอกาส และความเคลื่อนไหว)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {focusDeals.map((deal, i) => (
          <motion.div 
            key={deal.id} 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden group hover:border-violet-300 hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => onOpenDeal(deal)}
          >
            <div className="p-4 flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                  Score: {Math.round(deal.focusScore).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">{deal.stage}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-violet-700 transition-colors">
                {deal.title}
              </h4>
              <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{deal.company}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">มูลค่า</p>
                  <p className="text-sm font-black text-slate-700 mt-0.5">{formatCurrency(deal.value)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">นิ่งมาแล้ว</p>
                  <p className="text-sm font-black text-slate-700 mt-0.5">
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
                    className="p-3 bg-violet-50 rounded-xl border border-violet-100 relative"
                  >
                    <Sparkles size={14} className="text-violet-500 absolute top-3 right-3" />
                    <p className="text-xs text-violet-800 leading-relaxed font-medium pr-6">
                      {explanations[deal.id]}
                    </p>
                  </motion.div>
                ) : (
                  <button
                    onClick={(e) => handleExplain(e, deal)}
                    disabled={explainingId === deal.id}
                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {explainingId === deal.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        กำลังวิเคราะห์...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
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
