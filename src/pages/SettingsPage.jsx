import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Target, Users, ListTree, User, Building2, ShieldCheck, Loader2 } from 'lucide-react';

import { TargetsSection } from '../components/settings/TargetsSection';
import { TeamSection } from '../components/settings/TeamSection';
import { PipelineSection } from '../components/settings/PipelineSection';
import { CompanySection } from '../components/settings/CompanySection';
import { AccountSection } from '../components/settings/AccountSection';
import { UsersSection } from '../components/settings/UsersSection';

const BASE_SECTIONS = [
  { id: 'targets',  label: 'เป้าหมายยอดขาย', icon: Target },
  { id: 'team',     label: 'ทีมงาน',           icon: Users },
  { id: 'pipeline', label: 'ขั้นตอนดีล',        icon: ListTree },
  { id: 'company',  label: 'บริษัท',            icon: Building2 },
  { id: 'account',  label: 'บัญชีผู้ใช้',        icon: User },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('targets');
  const { isLoading: settingsLoading } = useSettings();
  const { isLoading: teamLoading } = useTeam();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  
  const isAdmin = myProfile?.role === 'admin';

  const SECTIONS = isAdmin
    ? [...BASE_SECTIONS, { id: 'users', label: 'ผู้ใช้งาน', icon: ShieldCheck }]
    : BASE_SECTIONS;

  if (settingsLoading || teamLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="animate-spin text-violet-500" size={28} />
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto pb-20 px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
        <p className="text-sm text-slate-500 mt-1">จัดการเป้าหมาย ทีมงาน และการตั้งค่าทั่วไปของแอป</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="lg:w-56 shrink-0">
          <nav className="space-y-1 lg:sticky lg:top-6">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all',
                  activeSection === s.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <s.icon size={16} />
                {s.label}
              </button>
            ))}
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
              {activeSection === 'users' && isAdmin && <UsersSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
