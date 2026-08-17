import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Target, Users, ListTree, User, Building2, ShieldCheck, Loader2, Sparkles, Settings2, Plug, Crown, Shield, Bell, History, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Database } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

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

  const [customFieldDefs, setCustomFieldDefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_custom_fields') || '[]'); }
    catch { return []; }
  });
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [showAddField, setShowAddField] = useState(false);

  const saveCustomFields = (fields) => {
    setCustomFieldDefs(fields);
    localStorage.setItem('crm_custom_fields', JSON.stringify(fields));
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const newField = { key, label: newFieldLabel.trim(), type: newFieldType };
    saveCustomFields([...customFieldDefs, newField]);
    setNewFieldLabel('');
    setShowAddField(false);
  };

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
    <div className="max-w-[1200px] mx-auto pb-20 px-2 sm:px-4 md:px-6 relative ui-enter">
      {/* Ambient glows */}
      <div className="fixed top-20 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          icon={Settings2}
          title="ตั้งค่าระบบ"
          description="จัดการเป้าหมาย ทีมงาน และการตั้งค่าทั่วไปของแอปพลิเคชัน"
          badge={<Sparkles size={18} className="text-amber-400" />}
          breadcrumb={
            activeItem && (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <span>Settings</span>
                <ChevronRight size={12} />
                <span className="text-violet-600">{activeItem.label}</span>
              </div>
            )
          }
          rightContent={
            <div className="self-start sm:self-center shrink-0">
              {isOwner ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-black text-amber-700 shadow-sm backdrop-blur-sm">
                  <Crown size={13} className="text-amber-500 fill-current" />
                  Owner
                </span>
              ) : isAdmin ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700 backdrop-blur-sm">
                  <Shield size={13} className="text-emerald-500" />
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 border border-violet-100 text-xs font-black text-slate-700 shadow-sm">
                  <User size={13} className="text-slate-500" />
                  Member
                </span>
              )}
            </div>
          }
        />
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── SIDEBAR NAV ── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:w-68 shrink-0"
        >
          <nav className="lg:sticky lg:top-8 bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-xl p-3 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
            {/* Base groups */}
            {SECTION_GROUPS.map((group) => (
              <div key={group.groupLabel}>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pb-1.5 pt-1">{group.groupLabel}</p>
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
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider px-3 pb-1.5 pt-1">ระบบ (Owner)</p>
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
              {activeSection === 'pipeline'      && (
                <div className="space-y-6">
                  <PipelineSection />
                  
                  {/* Custom Fields Card */}
                  <div className="bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                          <Database size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Custom Fields</h3>
                          <p className="text-xs text-slate-400">เพิ่มข้อมูลพิเศษในดีลของคุณ</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddField(s => !s)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus size={13} /> เพิ่ม Field
                      </button>
                    </div>

                    {showAddField && (
                      <div className="mb-4 p-4 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 rounded-2xl flex flex-col gap-3">
                        <p className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">เพิ่ม Field ใหม่</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ชื่อ Field เช่น LinkedIn URL"
                            value={newFieldLabel}
                            onChange={e => setNewFieldLabel(e.target.value)}
                            className="flex-1 h-9 px-3 rounded-xl border border-violet-200 dark:border-violet-800/40 bg-white dark:bg-[#171926] text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-violet-400"
                            onKeyDown={e => { if (e.key === 'Enter') handleAddField(); }}
                          />
                          <select
                            value={newFieldType}
                            onChange={e => setNewFieldType(e.target.value)}
                            className="h-9 px-3 rounded-xl border border-violet-200 dark:border-violet-800/40 bg-white dark:bg-[#171926] text-slate-900 dark:text-white text-sm font-semibold outline-none cursor-pointer"
                          >
                            <option value="text">ข้อความ</option>
                            <option value="number">ตัวเลข</option>
                            <option value="url">URL</option>
                            <option value="date">วันที่</option>
                          </select>
                          <button
                            onClick={handleAddField}
                            className="h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors cursor-pointer"
                          >
                            บันทึก
                          </button>
                        </div>
                      </div>
                    )}

                    {customFieldDefs.length === 0 && !showAddField && (
                      <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                        <Database size={20} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-400 font-medium">ยังไม่มี Custom Fields</p>
                        <p className="text-xs text-slate-400/80 mt-1">คลิก "เพิ่ม Field" เพื่อสร้างบันทึก field พิเศษของคุณเอง</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {customFieldDefs.map((field, idx) => (
                        <div key={field.key} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-800/40 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                            <Database size={13} className="text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{field.label}</p>
                            <p className="text-xs text-slate-400">{field.key} · {field.type}</p>
                          </div>
                          <button
                            onClick={() => saveCustomFields(customFieldDefs.filter((_, i) => i !== idx))}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-200 relative overflow-hidden group cursor-pointer',
        isActive
          ? isAdmin
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
            : 'bg-violet-600 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
      )}
    >
      {/* Hover shimmer */}
      {isActive && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}

      {/* Icon container */}
      <div className={cn(
        'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
        isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5 group-hover:bg-violet-100 dark:group-hover:bg-violet-950/50 group-hover:scale-110'
      )}>
        <Icon size={15} className={cn(
          'transition-all duration-300',
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400'
        )} />
      </div>

      {/* Label + desc */}
      <div className="flex-1 text-left min-w-0">
        <p className={cn('text-[13px] font-bold leading-tight truncate', isActive ? 'text-white' : '')}>{s.label}</p>
        {s.desc && <p className={cn('text-[10px] font-medium truncate leading-tight', isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500')}>{s.desc}</p>}
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
