import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Target, Users, ListTree, User, Building2, ShieldCheck, Loader2, Sparkles, Settings2, Plug, Crown, Shield, Bell, History, ChevronRight } from 'lucide-react';
import { Database } from 'lucide-react';

import { TargetsSection } from '../components/settings/TargetsSection';
import { TeamSection } from '../components/settings/TeamSection';
import { PipelineSection } from '../components/settings/PipelineSection';
import { CompanySection } from '../components/settings/CompanySection';
import { AccountSection } from '../components/settings/AccountSection';
import { UsersSection } from '../components/settings/UsersSection';
import { BackupSection } from '../components/settings/BackupSection';
import { IntegrationSection } from '../components/settings/IntegrationSection';
import { ConsoleCenterSection } from '../components/settings/ConsoleCenterSection';
import { NotificationSection } from '../components/settings/NotificationSection';
import { AuditLogSection } from '../components/settings/AuditLogSection';

const SECTION_GROUPS = [
  {
    groupLabel: 'ธุรกิจ',
    items: [
      { id: 'targets',  label: 'เป้าหมายยอดขาย', icon: Target,    desc: 'รายเดือน / รายปี' },
      { id: 'team',     label: 'ทีมงาน',          icon: Users,     desc: 'สมาชิก & สิทธิ์' },
      { id: 'pipeline', label: 'ขั้นตอนดีล',      icon: ListTree,  desc: 'Custom Stages' },
      { id: 'company',  label: 'บริษัท & AI',     icon: Building2, desc: 'โลโก้ & ตั้งค่า AI' },
    ],
  },
  {
    groupLabel: 'ส่วนตัว',
    items: [
      { id: 'account',       label: 'บัญชีผู้ใช้',  icon: User,      desc: 'โปรไฟล์ & รหัสผ่าน' },
      { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell,      desc: 'เสียง & Desktop' },
    ],
  },
  {
    groupLabel: 'ข้อมูล & เชื่อมต่อ',
    items: [
      { id: 'data',    label: 'จัดการข้อมูล', icon: Database, desc: 'Export & Backup' },
      { id: 'plugins', label: 'การเชื่อมต่อ',  icon: Plug,     desc: 'Webhook & API' },
    ],
  },
];

const ADMIN_SECTIONS = [
  { id: 'users',   label: 'ผู้ใช้งาน',          icon: ShieldCheck, desc: 'จัดการทีม',        group: 'ระบบ (Admin)' },
  { id: 'audit',   label: 'ประวัติการทำงาน',    icon: History,     desc: 'Audit Log',        group: 'ระบบ (Admin)' },
  { id: 'console', label: 'Console Center',    icon: Crown,       desc: 'Owner Only 👑',     group: 'ระบบ (Admin)' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('targets');
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { isLoading: teamLoading } = useTeam();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);

  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'owner';
  const isOwner = myProfile?.role === 'owner' || user?.id === settings?.owner_id;

  // Flatten all sections for content rendering
  const allSections = [
    ...SECTION_GROUPS.flatMap(g => g.items),
    ...(isOwner ? ADMIN_SECTIONS : []),
  ];
  const activeItem = allSections.find(s => s.id === activeSection);

  if (settingsLoading || teamLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" size={26} />
      </div>
      <p className="text-sm font-semibold text-slate-400">กำลังโหลดการตั้งค่า...</p>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto pb-20 px-4 md:px-0 relative">
      {/* Ambient glows */}
      <div className="fixed top-20 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ── PREMIUM HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800/60 p-8 md:p-12 shadow-2xl shadow-slate-950/20"
      >
        {/* Grid mesh overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        {/* Glow orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-600/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        {/* Floating dots */}
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 right-1/3 w-2.5 h-2.5 bg-violet-400/25 rounded-full blur-sm pointer-events-none" />
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-10 right-16 w-4 h-4 bg-indigo-400/15 rounded-full blur-sm pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl shadow-violet-500/10 relative overflow-hidden group flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Settings2 size={30} className="relative z-10 text-violet-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">ตั้งค่าระบบ</h1>
                <Sparkles size={18} className="text-amber-400" />
              </div>
              <p className="text-violet-300/70 font-medium text-sm">จัดการเป้าหมาย ทีมงาน และการตั้งค่าทั่วไปของแอปพลิเคชัน</p>
              {/* Breadcrumb */}
              {activeItem && (
                <div className="flex items-center gap-1.5 mt-2 text-violet-400/60 text-xs font-semibold">
                  <span>Settings</span>
                  <ChevronRight size={12} />
                  <span className="text-violet-300">{activeItem.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role badge */}
          <div className="self-start sm:self-center shrink-0">
            {isOwner ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-500/20 text-xs font-black text-violet-300 shadow-sm backdrop-blur-sm">
                <Crown size={13} className="text-amber-400 fill-current" />
                Owner
              </span>
            ) : isAdmin ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-300 backdrop-blur-sm">
                <Shield size={13} className="text-emerald-400" />
                Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-black text-slate-300">
                <User size={13} className="text-slate-400" />
                Member
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── SIDEBAR NAV ── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:w-68 shrink-0"
        >
          <nav className="lg:sticky lg:top-8 bg-white/60 backdrop-blur-2xl p-3 rounded-[2rem] border border-white/80 shadow-xl shadow-slate-200/40 space-y-4">
            {/* Base groups */}
            {SECTION_GROUPS.map((group) => (
              <div key={group.groupLabel}>
                <p className="text-[10px] font-black text-slate-400/70 uppercase tracking-widest px-3 pb-1.5 pt-1">{group.groupLabel}</p>
                <div className="space-y-0.5">
                  {group.items.map((s) => {
                    const isActive = activeSection === s.id;
                    return (
                      <NavItem key={s.id} s={s} isActive={isActive} onClick={() => setActiveSection(s.id)} />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Admin group */}
            {isOwner && (
              <div>
                <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest px-3 pb-1.5 pt-1">ระบบ (Owner)</p>
                <div className="space-y-0.5">
                  {ADMIN_SECTIONS.map((s) => {
                    const isActive = activeSection === s.id;
                    return (
                      <NavItem key={s.id} s={s} isActive={isActive} onClick={() => setActiveSection(s.id)} isAdmin />
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </motion.div>

        {/* ── CONTENT ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ type: 'spring', stiffness: 420, damping: 35 }}
            >
              {activeSection === 'targets'       && <TargetsSection />}
              {activeSection === 'team'          && <TeamSection />}
              {activeSection === 'pipeline'      && <PipelineSection />}
              {activeSection === 'company'       && <CompanySection />}
              {activeSection === 'account'       && <AccountSection />}
              {activeSection === 'notifications' && <NotificationSection />}
              {activeSection === 'data'          && <BackupSection />}
              {activeSection === 'plugins'       && <IntegrationSection />}
              {activeSection === 'users'   && (isAdmin || isOwner) && <UsersSection />}
              {activeSection === 'audit'   && (isAdmin || isOwner) && <AuditLogSection />}
              {activeSection === 'console' && isOwner              && <ConsoleCenterSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── NavItem Sub-component ──
function NavItem({ s, isActive, onClick, isAdmin = false }) {
  const Icon = s.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-200 relative overflow-hidden group',
        isActive
          ? isAdmin
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
          : 'text-slate-600 hover:bg-white/80 hover:text-violet-700 hover:shadow-sm'
      )}
    >
      {/* Hover shimmer */}
      {isActive && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}

      {/* Icon container */}
      <div className={cn(
        'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
        isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-violet-100 group-hover:scale-110'
      )}>
        <Icon size={15} className={cn(
          'transition-all duration-300',
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-violet-600'
        )} />
      </div>

      {/* Label + desc */}
      <div className="flex-1 text-left min-w-0">
        <p className={cn('text-[13px] font-bold leading-tight truncate', isActive ? 'text-white' : '')}>{s.label}</p>
        {s.desc && <p className={cn('text-[10px] font-medium truncate leading-tight', isActive ? 'text-white/60' : 'text-slate-400')}>{s.desc}</p>}
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white/80 rounded-r-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
