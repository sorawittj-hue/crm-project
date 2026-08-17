import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Clock, FileText, CalendarClock, MessageSquare, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

const ACTIVITY_ICON = {
  call:      { Icon: Phone,         color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400',    border: 'border-blue-200 dark:border-blue-800/40',    label: 'โทรหา' },
  email:     { Icon: Mail,          color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-500 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/40',  label: 'อีเมล' },
  meeting:   { Icon: Clock,         color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800/40',   label: 'ประชุม' },
  note:      { Icon: FileText,      color: 'bg-slate-50 dark:bg-white/10 text-slate-500 dark:text-slate-400',   border: 'border-slate-200 dark:border-white/10',   label: 'บันทึก' },
  task:      { Icon: CalendarClock, color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/40',  label: 'งาน' },
  whatsapp:  { Icon: MessageSquare, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40', label: 'WhatsApp' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function groupByDate(activities) {
  const groups = {};
  activities.forEach(act => {
    const date = new Date(act.created_at || act.scheduled_at);
    const key = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(act);
  });
  return Object.entries(groups);
}

export default function CustomerTimeline({ customer, deals = [], allActivities = [] }) {
  const timeline = useMemo(() => {
    // Get all deal IDs linked to this customer
    const customerDealIds = new Set(
      deals
        .filter(d => d.customer_id === customer?.id || 
          (customer?.company && d.company?.toLowerCase() === customer?.company?.toLowerCase()))
        .map(d => d.id)
    );

    // Filter activities that belong to those deals
    const customerActivities = allActivities
      .filter(a => customerDealIds.has(a.deal_id))
      .sort((a, b) => new Date(b.created_at || b.scheduled_at) - new Date(a.created_at || a.scheduled_at));

    return customerActivities;
  }, [customer, deals, allActivities]);

  const grouped = groupByDate(timeline);

  if (!timeline.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
          <Activity size={22} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">ยังไม่มีประวัติกิจกรรม</p>
        <p className="text-xs text-slate-300 dark:text-slate-600">กิจกรรมจากดีลที่เชื่อมกับลูกค้ารายนี้จะแสดงที่นี่</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {grouped.map(([dateLabel, activities], groupIdx) => (
        <div key={dateLabel}>
          {/* Date separator */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
              {dateLabel}
            </span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
          </div>

          {/* Activities */}
          <div className="space-y-2">
            {activities.map((activity, idx) => {
              const config = ACTIVITY_ICON[activity.type] || ACTIVITY_ICON.note;
              const { Icon } = config;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (groupIdx * 0.05) + (idx * 0.04), duration: 0.3 }}
                  className="flex items-start gap-3 group"
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5',
                    config.color, config.border
                  )}>
                    <Icon size={14} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {activity.title || config.label}
                      </p>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                        {timeAgo(activity.created_at || activity.scheduled_at)}
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {activity.notes}
                      </p>
                    )}
                    {activity.deal_title && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/40 px-2 py-0.5 rounded-full">
                        {activity.deal_title}
                      </span>
                    )}
                    {activity.completed_at && (
                      <span className="inline-flex items-center gap-1 mt-1 ml-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ เสร็จสิ้น
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
