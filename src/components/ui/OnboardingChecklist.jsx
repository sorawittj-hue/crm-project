import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCustomers } from '../../hooks/useCustomers';
import { useDeals } from '../../hooks/useDeals';
import { useSettings } from '../../hooks/useSettings';
import { useTeam } from '../../hooks/useTeam';
import { cn } from '../../lib/utils';

const DISMISS_KEY = (uid) => `nova_onboarding_dismissed_${uid}`;

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { customers } = useCustomers();
  const { deals } = useDeals();
  const { settings } = useSettings();
  const { teamMembers } = useTeam();

  // Check dismiss state per user
  useEffect(() => {
    if (!user?.id) return;
    const isDismissed = localStorage.getItem(DISMISS_KEY(user.id)) === 'true';
    setDismissed(isDismissed);
  }, [user?.id]);

  const handleDismiss = () => {
    if (user?.id) localStorage.setItem(DISMISS_KEY(user.id), 'true');
    setDismissed(true);
  };

  const steps = useMemo(() => [
    {
      id: 'signup',
      label: 'สร้างบัญชีสำเร็จ',
      done: true, // Always done if they're here
      action: null,
      actionLabel: null,
    },
    {
      id: 'customer',
      label: 'เพิ่มลูกค้าคนแรก',
      done: (customers?.length ?? 0) > 0,
      action: () => navigate('/customers'),
      actionLabel: '+ เพิ่มลูกค้า',
    },
    {
      id: 'deal',
      label: 'สร้างดีลแรก',
      done: (deals?.length ?? 0) > 0,
      action: () => navigate('/pipeline'),
      actionLabel: '+ สร้างดีล',
    },
    {
      id: 'target',
      label: 'ตั้งเป้าหมายรายเดือน',
      done: !!(settings?.monthly_target && settings.monthly_target > 0),
      action: () => navigate('/settings?tab=targets'),
      actionLabel: 'ตั้งค่าเลย',
    },
    {
      id: 'team',
      label: 'เชิญสมาชิกทีม',
      done: (teamMembers?.length ?? 0) > 1,
      action: () => navigate('/settings?tab=team'),
      actionLabel: '+ เชิญสมาชิก',
    },
  ], [customers, deals, settings, teamMembers, navigate]);

  const doneCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const allDone = doneCount === total;
  const progress = Math.round((doneCount / total) * 100);

  // Only show for new members (not all done, not dismissed)
  // Show for first 7 days or until all steps complete
  const accountAge = user?.created_at
    ? (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  if (dismissed || accountAge > 7 || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mx-4 mb-4 rounded-2xl border border-violet-100 bg-white shadow-sm shadow-violet-500/5 overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black',
              allDone ? 'bg-emerald-500 text-white' : 'bg-violet-100 text-violet-700'
            )}>
              {allDone ? <Sparkles size={14} /> : `${doneCount}/${total}`}
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">
                {allDone ? 'เตรียมพร้อมครบแล้ว! 🎉' : 'เริ่มต้นอย่างมืออาชีพ'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{progress}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all"
            >
              <X size={13} />
            </button>
            <div className="p-1 text-slate-400">
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-1.5 border-t border-slate-100">
                {steps.map((step, i) => (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-2.5 py-1.5',
                      i < steps.length - 1 && 'border-b border-slate-50'
                    )}
                  >
                    <CheckCircle2
                      size={16}
                      className={step.done ? 'text-emerald-500 shrink-0' : 'text-slate-200 shrink-0'}
                    />
                    <span className={cn(
                      'text-xs flex-1',
                      step.done
                        ? 'text-slate-400 line-through font-medium'
                        : 'text-slate-700 font-bold'
                    )}>
                      {step.label}
                    </span>
                    {!step.done && step.action && (
                      <button
                        onClick={step.action}
                        className="text-[10px] font-black text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-all whitespace-nowrap"
                      >
                        {step.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
