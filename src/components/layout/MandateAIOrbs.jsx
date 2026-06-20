import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Zap, Trash2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const DISMISSED_ORBS_KEY = 'crm.dismissedStaleDeals.v1';

function getDismissedDeals() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_ORBS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDismissedDeal(dealId, latestMs) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedDeals();
    current[dealId] = latestMs;
    localStorage.setItem(DISMISSED_ORBS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save dismissed deal ID:', e);
  }
}

function saveMultipleDismissedDeals(dealsList) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedDeals();
    for (const d of dealsList) {
      current[d.id] = d._latestMs;
    }
    localStorage.setItem(DISMISSED_ORBS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save dismissed deal IDs:', e);
  }
}

export default function MandateAIOrbs({ deals = [], activities = [] }) {
  const [staleHighValueDeals, setStaleHighValueDeals] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const setPendingOpenDeal = useAppStore(state => state.setPendingOpenDeal);
  const isTourActive = useOnboardingStore(state => state.isTourActive);

  useEffect(() => {
    // Logic: Find active deals with value >= 100,000 THB, not won/lost,
    // and no activity in the last 7 days.
    const now = Date.now();
    const activeHighValue = deals.filter(d => 
      !['won', 'lost'].includes(d.stage) && Number(d.value) >= 100000
    );

    const dismissedMap = getDismissedDeals();

    const flagged = activeHighValue.filter(deal => {
      const lastActivityDate = new Date(deal.last_activity || deal.created_at || '1970-01-01').getTime();
      const dealActivities = activities.filter(a => a.deal_id === deal.id);
      
      let latestMs = lastActivityDate;
      if (dealActivities.length > 0) {
        const latestAct = dealActivities.reduce((latest, act) => {
          const actTime = new Date(act.created_at).getTime();
          return actTime > latest ? actTime : latest;
        }, 0);
        latestMs = Math.max(latestMs, latestAct);
      }

      // Check if this deal was already dismissed with the current state of activity
      if (dismissedMap[deal.id] === latestMs) {
        return false;
      }

      const daysSince = (now - latestMs) / (24 * 60 * 60 * 1000);
      deal._daysStale = Math.floor(daysSince);
      deal._latestMs = latestMs;

      return daysSince >= 7;
    });

    setStaleHighValueDeals(flagged);
  }, [deals, activities]);

  const handleFollowUp = (deal) => {
    setPendingOpenDeal(deal);
    navigate('/pipeline');
    setIsExpanded(false);
  };

  const handleDismiss = (dealId, latestMs) => {
    saveDismissedDeal(dealId, latestMs);
    setStaleHighValueDeals(prev => prev.filter(d => d.id !== dealId));
  };

  const handleDismissAll = () => {
    saveMultipleDismissedDeals(staleHighValueDeals);
    setStaleHighValueDeals([]);
    setIsExpanded(false);
  };

  if (staleHighValueDeals.length === 0 || isTourActive) return null;

  return (
    <div className="relative flex flex-col items-end gap-3 pointer-events-none select-none font-sans">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* COLLAPSED PULSING ORB PILL */
          <motion.button
            key="collapsed-orb"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            onClick={() => setIsExpanded(true)}
            className="pointer-events-auto flex items-center gap-3 bg-slate-900 text-white pl-4 pr-3.5 py-3 rounded-full shadow-2xl border border-slate-800 hover:bg-slate-805 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-rose-500/10"
            title="คลิกเพื่อดูรายละเอียดดีลสะดุด"
          >
            <div className="relative flex items-center justify-center">
              <Zap size={16} className="text-rose-400 fill-rose-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase">
              Mandate AI: <span className="text-rose-400">{staleHighValueDeals.length} ดีลเสี่ยง</span>
            </span>
          </motion.button>
        ) : (
          /* EXPANDED UNIFIED PANEL */
          <motion.div
            key="expanded-panel"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 15 }}
            className="pointer-events-auto w-80 md:w-96 bg-slate-900/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-800 flex flex-col gap-4 text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <Sparkles size={14} className="text-rose-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Strategic Mandate AI</h4>
                  <p className="text-[10px] text-slate-400 font-medium">ดีล ฿100K+ ที่ไม่มีความเคลื่อนไหว 7 วัน+</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="ย่อขนาด"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {staleHighValueDeals.map(deal => (
                <div
                  key={deal.id}
                  className="p-3 rounded-2xl bg-slate-800/30 border border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate" title={deal.company || deal.title}>
                      {deal.company || deal.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-400 tabular-nums">
                        {formatCurrency(deal.value)}
                      </span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-[10px] font-semibold text-rose-400">
                        เงียบหาย {deal._daysStale} วัน
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDismiss(deal.id, deal._latestMs)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="ซ่อนชั่วคราว"
                    >
                      <X size={13} />
                    </button>
                    <button
                      onClick={() => handleFollowUp(deal)}
                      className="p-1.5 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-500 transition-colors"
                      title="เปิดหน้าติดตาม"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-400">
              <span>พบดีลสะดุด {staleHighValueDeals.length} ดีล</span>
              <button
                onClick={handleDismissAll}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 transition-all"
              >
                <Trash2 size={11} />
                ซ่อนดีลทั้งหมด
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
