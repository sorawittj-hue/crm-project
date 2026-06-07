import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatters';

export default function MandateAIOrbs({ deals = [], activities = [] }) {
  const [staleHighValueDeals, setStaleHighValueDeals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Logic: Find deals with value >= 100,000 THB, not won/lost
    // and no activity in the last 7 days.
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    const activeHighValue = deals.filter(d => 
      !['won', 'lost'].includes(d.stage) && Number(d.value) >= 100000
    );

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

      const daysSince = (now - latestMs) / (24 * 60 * 60 * 1000);
      
      // Save it temporarily so we can map it
      deal._daysStale = Math.floor(daysSince);
      
      return daysSince >= 7;
    });

    setStaleHighValueDeals(flagged);
  }, [deals, activities]);

  if (staleHighValueDeals.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {staleHighValueDeals.map(deal => (
          <Orb 
            key={deal.id} 
            deal={deal} 
            onFollowUp={() => {
              navigate('/pipeline');
              // We could trigger a global state to open this deal's modal, but navigating to pipeline is a good start
            }} 
            onDismiss={() => {
              setStaleHighValueDeals(prev => prev.filter(d => d.id !== deal.id));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Orb({ deal, onFollowUp, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className="pointer-events-auto flex items-center gap-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-700/50 w-80"
    >
      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
        <Zap size={18} className="text-rose-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Action Required</p>
          <span className="text-[10px] font-bold text-slate-400">{deal._daysStale} วันที่เงียบหาย</span>
        </div>
        <p className="text-xs font-semibold text-white truncate">{deal.company || deal.title}</p>
        <p className="text-[11px] font-medium text-slate-400 tabular-nums">มูลค่า {formatCurrency(deal.value)}</p>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        <button 
          onClick={onDismiss}
          className="p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <X size={12} />
        </button>
        <button 
          onClick={onFollowUp}
          className="p-1 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 transition-colors"
          title="Follow-up ตอนนี้"
        >
          <ExternalLink size={12} />
        </button>
      </div>
    </motion.div>
  );
}
