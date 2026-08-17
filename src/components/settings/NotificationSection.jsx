import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { 
  Bell, Volume2, ShieldAlert, CalendarClock, Briefcase, 
  Clock, BarChart2, Play, Info
} from 'lucide-react';
import { useToast } from '../ui/Toast';

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  desktopEnabled: false,
  enabledCategories: {
    deal_at_risk: true,
    deal_closing_overdue: true,
    follow_up_overdue: true,
    deal_closing_soon: true,
    monthly_goal_at_risk: true,
    deal_stale: true,
  },
  staleDaysThreshold: 3
};

function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now); // F5
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    
    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio context chime blocked or failed:', e);
  }
}

export function NotificationSection() {
  const toast = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm.notificationSettings.v1');
      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
          enabledCategories: {
            ...DEFAULT_SETTINGS.enabledCategories,
            ...JSON.parse(stored).enabledCategories
          }
        });
      }
    } catch (e) {
      console.error('Failed to load notification settings:', e);
    }
  }, []);

  // Save settings helper
  const saveSettings = (updated) => {
    setSettings(updated);
    try {
      localStorage.setItem('crm.notificationSettings.v1', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    saveSettings(updated);
    if (updated.soundEnabled) {
      playNotificationChime();
    }
    toast.success(updated.soundEnabled ? 'เปิดเสียงแจ้งเตือนแล้ว' : 'ปิดเสียงแจ้งเตือนแล้ว');
  };

  const handleToggleDesktop = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบ Desktop');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('สิทธิ์ถูกบล็อกโดยเบราว์เซอร์ กรุณาเปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์ของคุณ');
      return;
    }

    if (settings.desktopEnabled) {
      const updated = { ...settings, desktopEnabled: false };
      saveSettings(updated);
      toast.success('ปิดการแจ้งเตือนบนเบราว์เซอร์แล้ว');
      return;
    }

    // If permission is default, ask user
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('คุณไม่ได้อนุญาตสิทธิ์การแจ้งเตือน');
        return;
      }
    }

    const updated = { ...settings, desktopEnabled: true };
    saveSettings(updated);
    toast.success('เปิดการแจ้งเตือนบนเบราว์เซอร์สำเร็จ!');
    // Trigger test notification
    new Notification('Nova Pipeline 🎯', {
      body: 'ระบบแจ้งเตือนผ่านหน้าจอเบราว์เซอร์เปิดใช้งานสำเร็จแล้ว',
      icon: '/icon.svg'
    });
  };

  const handleToggleCategory = (catId) => {
    const updatedCategories = {
      ...settings.enabledCategories,
      [catId]: !settings.enabledCategories[catId]
    };
    const updated = { ...settings, enabledCategories: updatedCategories };
    saveSettings(updated);
    toast.success('อัปเดตตัวกรองแจ้งเตือนแล้ว');
  };

  const handleThresholdChange = (val) => {
    const parsed = Math.max(1, Math.min(90, parseInt(val) || 3));
    const updated = { ...settings, staleDaysThreshold: parsed };
    saveSettings(updated);
  };

  const CATEGORY_ITEMS = [
    { id: 'deal_at_risk', label: 'ดีลวิกฤต/เสี่ยงหลุด', desc: 'เตือนเมื่อดีลที่กำลังเจรจาไม่มีความเคลื่อนไหวเกิน 3, 5 หรือ 7 วัน', icon: ShieldAlert, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
    { id: 'deal_closing_overdue', label: 'ดีลเลยกำหนดปิด', desc: 'เตือนเมื่อวันปิดดีลที่คาดไว้ได้ผ่านพ้นไปแล้ว', icon: Clock, color: 'text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400' },
    { id: 'follow_up_overdue', label: 'นัดหมายติดตาม', desc: 'เตือนเมื่อถึงกำหนดนัด หรือมีกิจกรรมการนัดหมายเลยกำหนดส่ง', icon: CalendarClock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    { id: 'deal_closing_soon', label: 'ดีลใกล้ครบกำหนดปิด', desc: 'เตือนล่วงหน้า 3-7 วันก่อนถึงกำหนดวันคาดว่าจะปิดดีล', icon: Briefcase, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' },
    { id: 'monthly_goal_at_risk', label: 'ยอดขายเฉลี่ยต่ำกว่าเป้า', desc: 'แจ้งเตือนเมื่อเป้ายอดขายรายเดือนของคุณเสี่ยงจะไม่ตรงตามเป้าหมาย', icon: BarChart2, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
    { id: 'deal_stale', label: 'ดีลหยุดนิ่งทั่วไป', desc: 'เตือนดีลขั้นตอนอื่นๆ ที่ไม่มีการขยับขยายตามจำนวนวันที่ระบุ', icon: Clock, color: 'text-slate-500 bg-slate-50 dark:bg-white/10 dark:text-slate-400' },
  ];

  return (
    <Card className="p-8 rounded-[2rem] bg-white/60 dark:bg-[#0f111a]/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ตั้งค่าการแจ้งเตือน (Notification Settings)</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">ตั้งค่าช่องทางการรับข่าวสาร เสียง และตัวกรองอัจฉริยะ</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Sound & Browser Permissions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sound Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-violet-50/20 dark:from-white/[0.04] dark:to-violet-950/20 border border-slate-100/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 flex items-center justify-center">
                <Volume2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">เสียงแจ้งเตือน (Chime)</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">เล่นเสียงกระดิ่งเบาๆ เมื่อมีแจ้งเตือนใหม่เข้า</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={playNotificationChime} 
                className="p-2 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
                title="ทดสอบเสียงกระดิ่ง"
              >
                <Play size={14} className="fill-current" />
              </button>
              <button
                onClick={handleToggleSound}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  settings.soundEnabled ? "bg-violet-600" : "bg-slate-200 dark:bg-white/20"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    settings.soundEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Desktop Push Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-white/[0.04] dark:to-blue-950/20 border border-slate-100/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">การแจ้งเตือนบนเบราว์เซอร์</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">ส่งข้อความข้ามหน้าจอ (Push) เมื่อแท็บอยู่ด้านหลัง</p>
              </div>
            </div>
            <button
              onClick={handleToggleDesktop}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                settings.desktopEnabled ? "bg-blue-600" : "bg-slate-200 dark:bg-white/20"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  settings.desktopEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">เลือกเปิด/ปิด แต่ละประเภทการแจ้งเตือน</h3>
          
          <div className="space-y-2">
            {CATEGORY_ITEMS.map((cat) => {
              const Icon = cat.icon;
              const isEnabled = settings.enabledCategories[cat.id];
              return (
                <div 
                  key={cat.id} 
                  className={cn(
                    "flex items-start justify-between p-4 rounded-2xl border transition-all duration-300",
                    isEnabled 
                      ? "bg-white dark:bg-[#171926] border-slate-100 dark:border-white/10 hover:border-violet-100 dark:hover:border-violet-500/30 hover:shadow-sm" 
                      : "bg-slate-50/50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.06] opacity-60"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cat.color)}>
                      <Icon size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{cat.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">{cat.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleCategory(cat.id)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isEnabled ? "bg-violet-600" : "bg-slate-200 dark:bg-white/20"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isEnabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Days Threshold Config */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <Info size={16} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">เกณฑ์ประเมินดีลไม่มีความเคลื่อนไหว (Stale Threshold)</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">ระบุจำนวนวันที่ดีลไม่มีบันทึกหรือความขยับขยาย ก่อนแจ้งเป็นดีลหยุดนิ่ง</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={90}
              value={settings.staleDaysThreshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              className="w-16 h-10 text-center font-bold text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171926] focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 transition-all outline-none"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">วัน</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
