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
    { id: 'signup',   label: 'สร้างบัญชีสำเร็จ',      done: true,                                       action: null,                              actionLabel: null },
    { id: 'customer', label: 'เพิ่มลูกค้าคนแรก',      done: (customers?.length ?? 0) > 0,               action: () => navigate('/customers'),       actionLabel: '+ เพิ่มลูกค้า' },
    { id: 'deal',     label: 'สร้างดีลแรก',            done: (deals?.length ?? 0) > 0,                   action: () => navigate('/pipeline'),        actionLabel: '+ สร้างดีล' },
    { id: 'target',   label: 'ตั้งเป้าหมายรายเดือน',  done: !!(settings?.monthly_target > 0),           action: () => navigate('/settings'),        actionLabel: 'ตั้งค่าเลย' },
    { id: 'team',     label: 'เชิญสมาชิกทีม',          done: (teamMembers?.length ?? 0) > 1,             action: () => navigate('/settings'),        actionLabel: '+ เชิญสมาชิก' },
  ], [customers, deals, settings, teamMembers, navigate]);

  const doneCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const allDone = doneCount === total;
  const progress = Math.round((doneCount / total) * 100);

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
        className="mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))',
          border: '1px solid rgba(139,92,246,0.2)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm"
              style={{
                background: allDone
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #7c3aed, #6366f1)',
              }}
            >
              {allDone ? <Sparkles size={13} /> : `${doneCount}/${total}`}
            </div>
            <div>
              <p className="text-[11px] font-black" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {allDone ? 'พร้อมแล้ว! 🎉' : 'เริ่มต้นอย่างมืออาชีพ'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1 w-20 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #a78bfa, #818cf8)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] font-bold" style={{ color: 'rgba(167,139,250,0.7)' }}>
                  {progress}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="p-1 rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
            >
              <X size={13} />
            </button>
            <div className="p-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
              <div className="px-4 pb-3 space-y-1" style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}>
                {steps.map((step, i) => (
                  <div
                    key={step.id}
                    className={cn('flex items-center gap-2.5 py-1.5', i < steps.length - 1 && 'border-b')}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <CheckCircle2
                      size={15}
                      className="shrink-0"
                      style={{ color: step.done ? '#34d399' : 'rgba(255,255,255,0.15)' }}
                    />
                    <span
                      className="text-[11px] flex-1 font-semibold"
                      style={{
                        color: step.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                        textDecoration: step.done ? 'line-through' : 'none',
                      }}
                    >
                      {step.label}
                    </span>
                    {!step.done && step.action && (
                      <button
                        onClick={step.action}
                        className="text-[10px] font-black px-2 py-0.5 rounded-lg transition-all whitespace-nowrap"
                        style={{
                          background: 'rgba(139,92,246,0.25)',
                          color: '#c4b5fd',
                          border: '1px solid rgba(139,92,246,0.3)',
                        }}
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
