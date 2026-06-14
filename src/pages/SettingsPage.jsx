import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Target, Users, ListTree, User, Building2, ShieldCheck, Loader2, Sparkles, Settings2, Plug, Crown } from 'lucide-react';

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
    <div className="max-w-[1100px] mx-auto pb-20 px-4 md:px-0">
      {/* Premium Header */}
      <div className="relative mb-10 overflow-hidden rounded-[2rem] bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 p-8 md:p-12 shadow-2xl shadow-indigo-900/20">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/30 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
            <Settings2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              ตั้งค่าระบบ <Sparkles size={24} className="text-amber-400" />
            </h1>
            <p className="text-violet-200 mt-2 font-medium text-sm md:text-base">จัดการเป้าหมาย ทีมงาน และการตั้งค่าทั่วไปของแอปพลิเคชัน</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar nav */}
        <div className="lg:w-64 shrink-0">
          <nav className="space-y-1.5 lg:sticky lg:top-8 bg-white/60 backdrop-blur-xl p-3 rounded-3xl border border-white shadow-xl shadow-slate-200/40">
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all relative overflow-hidden group',
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 border-0'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-violet-700 border border-transparent hover:border-slate-100'
                  )}
                >
                  {isActive && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  <s.icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-violet-600 transition-colors"} />
                  {s.label}
                  {isActive && (
                    <motion.div layoutId="activeNavIndicator" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
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
