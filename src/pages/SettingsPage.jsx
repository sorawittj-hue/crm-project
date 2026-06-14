import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Target, Users, ListTree, User, Building2, ShieldCheck, Loader2, Sparkles, Settings2, Plug, Crown, Shield } from 'lucide-react';

import { TargetsSection } from '../components/settings/TargetsSection';
import { TeamSection } from '../components/settings/TeamSection';
import { PipelineSection } from '../components/settings/PipelineSection';
import { CompanySection } from '../components/settings/CompanySection';
import { AccountSection } from '../components/settings/AccountSection';
import { UsersSection } from '../components/settings/UsersSection';
import { BackupSection } from '../components/settings/BackupSection';
import { IntegrationSection } from '../components/settings/IntegrationSection';
import { ConsoleCenterSection } from '../components/settings/ConsoleCenterSection';
import { Database } from 'lucide-react';

const BASE_SECTIONS = [
  { id: 'targets',  label: 'เป้าหมายยอดขาย', icon: Target },
  { id: 'team',     label: 'ทีมงาน',           icon: Users },
  { id: 'pipeline', label: 'ขั้นตอนดีล',        icon: ListTree },
  { id: 'company',  label: 'บริษัท',            icon: Building2 },
  { id: 'account',  label: 'บัญชีผู้ใช้',        icon: User },
  { id: 'data',     label: 'จัดการข้อมูล',       icon: Database },
  { id: 'plugins',  label: 'การเชื่อมต่อ',       icon: Plug },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('targets');
  const { isLoading: settingsLoading } = useSettings();
  const { isLoading: teamLoading } = useTeam();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  
  const isAdmin = myProfile?.role === 'admin';
  const isOwner = user?.email === 'sorawittj@gmail.com';

  const SECTIONS = isOwner
    ? [
        ...BASE_SECTIONS,
        { id: 'users', label: 'ผู้ใช้งาน', icon: ShieldCheck },
        { id: 'console', label: 'Console Center 👑', icon: Crown }
      ]
    : isAdmin
      ? [...BASE_SECTIONS, { id: 'users', label: 'ผู้ใช้งาน', icon: ShieldCheck }]
      : BASE_SECTIONS;

  if (settingsLoading || teamLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="animate-spin text-violet-500" size={28} />
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto pb-20 px-4 md:px-0 relative">
      {/* Decorative Glowing Background Blobs */}
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Premium Header */}
      <div className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl shadow-indigo-950/20">
        {/* Animated Background Mesh & Orbs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-600/20 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        {/* Floating Particle Orbs */}
        <motion.div 
          animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-8 right-1/4 w-3 h-3 bg-violet-400/30 rounded-full blur-sm"
        />
        <motion.div 
          animate={{ y: [0, 8, 0], scale: [1, 0.95, 1] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-12 right-12 w-4 h-4 bg-indigo-400/20 rounded-full blur-sm"
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/25 to-pink-500/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Settings2 size={32} className="relative z-10 text-violet-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                  ตั้งค่าระบบ
                </h1>
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <p className="text-violet-300/80 mt-2 font-medium text-xs md:text-sm">จัดการเป้าหมาย ทีมงาน และการตั้งค่าทั่วไปของแอปพลิชัน</p>
            </div>
          </div>

          {/* Account Role Status Badge */}
          <div className="self-start sm:self-center shrink-0">
            {isOwner ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-xs font-black text-violet-300 shadow-sm">
                <Crown size={12} className="text-amber-400 fill-current" />
                บัญชีผู้ดูแลระบบสูงสุด (Owner)
              </span>
            ) : isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-300">
                <Shield size={12} className="text-emerald-400" />
                บัญชีผู้ดูแลระบบ (Admin)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-slate-300">
                <User size={12} className="text-slate-400" />
                สิทธิ์สมาชิกทีม (Member)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar nav */}
        <div className="lg:w-64 shrink-0">
          <nav className="space-y-1 lg:sticky lg:top-8 bg-white/40 backdrop-blur-xl p-3 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 mb-1">เมนูการตั้งค่า</p>
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all relative overflow-hidden group',
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 border-0'
                      : 'text-slate-600 hover:bg-slate-50/80 hover:text-violet-700 border border-transparent hover:border-slate-100/50'
                  )}
                >
                  {isActive && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  <s.icon size={18} className={cn(
                    "transition-all duration-300 group-hover:scale-110",
                    isActive 
                      ? "text-white" 
                      : "text-slate-400 group-hover:text-violet-600 group-hover:-translate-y-0.5"
                  )} />
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">{s.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator" 
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 15, scale: 0.99 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -15, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              {activeSection === 'targets' && <TargetsSection />}
              {activeSection === 'team' && <TeamSection />}
              {activeSection === 'pipeline' && <PipelineSection />}
              {activeSection === 'company' && <CompanySection />}
              {activeSection === 'account' && <AccountSection />}
              {activeSection === 'data' && <BackupSection />}
              {activeSection === 'plugins' && <IntegrationSection />}
              {activeSection === 'users' && (isAdmin || isOwner) && <UsersSection />}
              {activeSection === 'console' && isOwner && <ConsoleCenterSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

