import { useState } from 'react';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { useTeam, useAddTeamMember, useUpdateTeamMember, useDeleteTeamMember } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile, useAllProfiles, useUpdateProfileRole, useUpdateMyPersonalTarget } from '../hooks/useUserProfiles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatFullCurrency } from '../lib/formatters';
import { STAGES } from '../lib/constants';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Target, Users, ListTree, User, Building2,
  Save, Plus, Trash2, Pencil, X, Check,
  LogOut, Loader2, ShieldCheck, Clock,
} from 'lucide-react';

const BASE_SECTIONS = [
  { id: 'targets',  label: 'เป้าหมายยอดขาย', icon: Target },
  { id: 'team',     label: 'ทีมงาน',           icon: Users },
  { id: 'pipeline', label: 'ขั้นตอนดีล',        icon: ListTree },
  { id: 'company',  label: 'บริษัท',            icon: Building2 },
  { id: 'account',  label: 'บัญชีผู้ใช้',        icon: User },
];

const MEMBER_COLORS = [
  { value: 'bg-violet-600', label: 'ม่วง' },
  { value: 'bg-indigo-600', label: 'น้ำเงินเข้ม' },
  { value: 'bg-blue-600',   label: 'น้ำเงิน' },
  { value: 'bg-emerald-600',label: 'เขียว' },
  { value: 'bg-amber-500',  label: 'เหลือง' },
  { value: 'bg-orange-600', label: 'ส้ม' },
  { value: 'bg-rose-600',   label: 'แดง' },
  { value: 'bg-pink-600',   label: 'ชมพู' },
  { value: 'bg-slate-700',  label: 'เทา' },
];

const STAGE_COLORS = {
  lead: 'bg-indigo-100 text-indigo-700',
  contact: 'bg-violet-100 text-violet-700',
  proposal: 'bg-pink-100 text-pink-700',
  negotiation: 'bg-orange-100 text-orange-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-600',
};

const EMPTY_MEMBER = { name: '', role: '', goal: '', color: 'bg-violet-600' };

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('targets');
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: teamMembers = [], isLoading: teamLoading } = useTeam();
  const { user, signOut } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  const isAdmin = myProfile?.role === 'admin';
  const { data: allProfiles = [] } = useAllProfiles();
  const updateRole = useUpdateProfileRole();
  const updatePersonalTarget = useUpdateMyPersonalTarget();

  const [personalTargetForm, setPersonalTargetForm] = useState(null);
  const [savingPersonalTarget, setSavingPersonalTarget] = useState(false);

  const handleSavePersonalTarget = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingPersonalTarget(true);
    try {
      await updatePersonalTarget.mutateAsync({ userId: user.id, target: personalTargetForm });
      setPersonalTargetForm(null);
    } finally {
      setSavingPersonalTarget(false);
    }
  };

  const SECTIONS = isAdmin
    ? [...BASE_SECTIONS, { id: 'users', label: 'ผู้ใช้งาน', icon: ShieldCheck }]
    : BASE_SECTIONS;

  const updateSettings = useUpdateSettings();
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  // Targets form state
  const [targetForm, setTargetForm] = useState(null);
  const [savingTargets, setSavingTargets] = useState(false);

  const initTargetForm = () => setTargetForm({
    monthly_target: settings?.monthly_target ?? 10000000,
  });

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    setSavingTargets(true);
    try {
      await updateSettings.mutateAsync({
        monthly_target: Number(targetForm.monthly_target),
      });
      setTargetForm(null);
    } finally {
      setSavingTargets(false);
    }
  };

  // Company form state
  const [companyForm, setCompanyForm] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const initCompanyForm = () => setCompanyForm({
    company_name: settings?.company_name ?? '',
    company_industry: settings?.company_industry ?? '',
    currency: settings?.currency ?? 'THB',
  });

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await updateSettings.mutateAsync(companyForm);
      setCompanyForm(null);
    } finally {
      setSavingCompany(false);
    }
  };

  // Team member form state
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({});
  const [confirmDeleteMember, setConfirmDeleteMember] = useState({ open: false, id: null, name: '' });

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    await addMember.mutateAsync({
      ...newMember,
      goal: Number(newMember.goal) || 0,
    });
    setNewMember(EMPTY_MEMBER);
    setAddingMember(false);
  };

  const handleUpdateMember = async (id) => {
    await updateMember.mutateAsync({
      id,
      ...editMemberForm,
      goal: Number(editMemberForm.goal) || 0,
    });
    setEditingMemberId(null);
  };

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

              {/* ── TARGETS ── */}
              {activeSection === 'targets' && (
                <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">เป้าหมายยอดขาย</h2>
                      <p className="text-xs text-slate-400 mt-0.5">กำหนดเป้าหมายรายเดือนของทีม</p>
                    </div>
                    {!targetForm && (
                      <Button
                        onClick={initTargetForm}
                        className="h-9 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20"
                      >
                        <Pencil size={13} className="mr-1.5" /> แก้ไข
                      </Button>
                    )}
                  </div>

                  {!targetForm ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <p className="text-sm font-medium text-slate-600">เป้าหมายรวมทีม (เดือน)</p>
                        <p className="text-lg font-black tabular-nums text-violet-600">{formatFullCurrency(settings?.monthly_target)}</p>
                      </div>
                      <p className="text-xs text-slate-400 px-1">เป้าหมายยอดขายส่วนตัวของแต่ละคน ตั้งได้ที่หน้า <span className="font-semibold text-violet-500">บัญชีผู้ใช้</span></p>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveTargets} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">เป้าหมายรวมทีม (บาท/เดือน)</label>
                        <Input
                          type="number"
                          value={targetForm.monthly_target}
                          onChange={(e) => setTargetForm({ ...targetForm, monthly_target: e.target.value })}
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setTargetForm(null)}
                          className="flex-1 h-10 rounded-xl text-slate-500 text-sm"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          type="submit"
                          disabled={savingTargets}
                          className="flex-[2] h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold border-0 shadow-md shadow-violet-500/20 flex items-center justify-center gap-2"
                        >
                          {savingTargets && <Loader2 size={13} className="animate-spin" />}
                          <Save size={13} /> บันทึก
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              )}

              {/* ── TEAM ── */}
              {activeSection === 'team' && (
                <div className="space-y-4">
                  <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">ทีมงาน</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{teamMembers.length} สมาชิก</p>
                      </div>
                      <Button
                        onClick={() => { setAddingMember(true); setNewMember(EMPTY_MEMBER); }}
                        className="h-9 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20"
                      >
                        <Plus size={13} className="mr-1.5" /> เพิ่มสมาชิก
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {teamMembers.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                        >
                          {editingMemberId === m.id ? (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <Input
                                placeholder="ชื่อ"
                                value={editMemberForm.name ?? m.name}
                                onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
                                className="h-9 rounded-xl border-slate-200 bg-white text-sm"
                              />
                              <Input
                                placeholder="ตำแหน่ง"
                                value={editMemberForm.role ?? m.role}
                                onChange={(e) => setEditMemberForm({ ...editMemberForm, role: e.target.value })}
                                className="h-9 rounded-xl border-slate-200 bg-white text-sm"
                              />
                              <Input
                                type="number"
                                placeholder="เป้าหมาย (บาท)"
                                value={editMemberForm.goal ?? m.goal}
                                onChange={(e) => setEditMemberForm({ ...editMemberForm, goal: e.target.value })}
                                className="h-9 rounded-xl border-slate-200 bg-white text-sm"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={editMemberForm.color ?? m.color}
                                  onChange={(e) => setEditMemberForm({ ...editMemberForm, color: e.target.value })}
                                  className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs outline-none"
                                >
                                  {MEMBER_COLORS.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleUpdateMember(m.id)}
                                  className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => setEditingMemberId(null)}
                                  className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0', m.color || 'bg-violet-600')}>
                                {m.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                                <p className="text-xs text-slate-400">{m.role}</p>
                              </div>
                              <p className="text-sm font-bold text-slate-700 tabular-nums hidden sm:block">
                                {formatFullCurrency(m.goal)}
                              </p>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => { setEditingMemberId(m.id); setEditMemberForm({ name: m.name, role: m.role, goal: m.goal, color: m.color }); }}
                                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-all"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteMember({ open: true, id: m.id, name: m.name })}
                                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {teamMembers.length === 0 && (
                        <div className="text-center py-10 text-slate-300">
                          <Users size={32} className="mx-auto mb-2" />
                          <p className="text-sm font-medium">ยังไม่มีสมาชิกในทีม</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Add member form */}
                  <AnimatePresence>
                    {addingMember && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <Card className="p-6 rounded-2xl bg-white border border-violet-200 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-800 mb-4">เพิ่มสมาชิกใหม่</h3>
                          <form onSubmit={handleAddMember} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">ชื่อ *</label>
                                <Input
                                  required
                                  placeholder="เช่น คุณสมชาย"
                                  value={newMember.name}
                                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">ตำแหน่ง</label>
                                <Input
                                  placeholder="เช่น นักขาย"
                                  value={newMember.role}
                                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">เป้าหมาย (บาท/เดือน)</label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={newMember.goal}
                                  onChange={(e) => setNewMember({ ...newMember, goal: e.target.value })}
                                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">สี</label>
                                <div className="flex gap-2 flex-wrap">
                                  {MEMBER_COLORS.map((c) => (
                                    <button
                                      key={c.value}
                                      type="button"
                                      onClick={() => setNewMember({ ...newMember, color: c.value })}
                                      className={cn(
                                        'w-7 h-7 rounded-lg transition-all',
                                        c.value,
                                        newMember.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAddingMember(false)}
                                className="flex-1 h-10 rounded-xl text-slate-500 text-sm"
                              >
                                ยกเลิก
                              </Button>
                              <Button
                                type="submit"
                                disabled={addMember.isPending}
                                className="flex-[2] h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold border-0 shadow-md shadow-violet-500/20 flex items-center justify-center gap-2"
                              >
                                {addMember.isPending && <Loader2 size={13} className="animate-spin" />}
                                <Plus size={13} /> เพิ่มสมาชิก
                              </Button>
                            </div>
                          </form>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── PIPELINE STAGES ── */}
              {activeSection === 'pipeline' && (
                <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">ขั้นตอนดีล</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ขั้นตอนที่ใช้ในระบบ Pipeline</p>
                  </div>
                  <div className="space-y-3">
                    {STAGES.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                        <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.id}</p>
                        </div>
                        <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', STAGE_COLORS[s.id])}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">
                    การปรับแต่งขั้นตอนสามารถทำได้ในรุ่นถัดไป
                  </p>
                </Card>
              )}

              {/* ── COMPANY ── */}
              {activeSection === 'company' && (
                <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">ข้อมูลบริษัท</h2>
                      <p className="text-xs text-slate-400 mt-0.5">ชื่อและข้อมูลองค์กร</p>
                    </div>
                    {!companyForm && (
                      <Button
                        onClick={initCompanyForm}
                        className="h-9 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20"
                      >
                        <Pencil size={13} className="mr-1.5" /> แก้ไข
                      </Button>
                    )}
                  </div>

                  {!companyForm ? (
                    <div className="space-y-4">
                      {[
                        { label: 'ชื่อบริษัท', value: settings?.company_name || '—' },
                        { label: 'อุตสาหกรรม', value: settings?.company_industry || '—' },
                        { label: 'สกุลเงิน', value: settings?.currency || 'THB' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                          <p className="text-sm font-medium text-slate-600">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <form onSubmit={handleSaveCompany} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">ชื่อบริษัท</label>
                        <Input
                          placeholder="เช่น บริษัท XYZ จำกัด"
                          value={companyForm.company_name}
                          onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">อุตสาหกรรม</label>
                        <Input
                          placeholder="เช่น Technology, Manufacturing"
                          value={companyForm.company_industry}
                          onChange={(e) => setCompanyForm({ ...companyForm, company_industry: e.target.value })}
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">สกุลเงิน</label>
                        <select
                          value={companyForm.currency}
                          onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-400"
                        >
                          <option value="THB">THB — บาทไทย</option>
                          <option value="USD">USD — ดอลลาร์</option>
                          <option value="SGD">SGD — ดอลลาร์สิงคโปร์</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setCompanyForm(null)}
                          className="flex-1 h-10 rounded-xl text-slate-500 text-sm"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          type="submit"
                          disabled={savingCompany}
                          className="flex-[2] h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold border-0 shadow-md shadow-violet-500/20 flex items-center justify-center gap-2"
                        >
                          {savingCompany && <Loader2 size={13} className="animate-spin" />}
                          <Save size={13} /> บันทึก
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              )}

              {/* ── ACCOUNT ── */}
              {activeSection === 'account' && (
                <div className="space-y-4">
                  <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">บัญชีผู้ใช้</h2>
                      <p className="text-xs text-slate-400 mt-0.5">ข้อมูลบัญชีที่ใช้เข้าสู่ระบบ</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white text-xl font-black">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้'}
                          </p>
                          <p className="text-xs text-slate-400">{user?.email}</p>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block',
                            isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
                          )}>
                            {isAdmin ? 'Admin' : 'Member'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={signOut}
                      variant="ghost"
                      className="w-full h-11 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-semibold text-sm"
                    >
                      <LogOut size={15} className="mr-2" /> ออกจากระบบ
                    </Button>
                  </Card>

                  {/* Personal Target Card */}
                  <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">เป้าหมายยอดขายส่วนตัว</h3>
                        <p className="text-xs text-slate-400 mt-0.5">ใช้ติดตามยอดขายของคุณเป็นการส่วนตัว</p>
                      </div>
                      {personalTargetForm === null && (
                        <Button
                          onClick={() => setPersonalTargetForm(myProfile?.personal_target ?? 0)}
                          className="h-9 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20"
                        >
                          <Pencil size={13} className="mr-1.5" /> แก้ไข
                        </Button>
                      )}
                    </div>

                    {personalTargetForm === null ? (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-50">
                        <p className="text-sm font-medium text-slate-600">เป้าหมายรายเดือน</p>
                        <p className="text-xl font-black tabular-nums text-violet-600">
                          {myProfile?.personal_target > 0 ? formatFullCurrency(myProfile.personal_target) : '—'}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSavePersonalTarget} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">เป้าหมายส่วนตัว (บาท/เดือน)</label>
                          <Input
                            type="number"
                            value={personalTargetForm}
                            onChange={(e) => setPersonalTargetForm(e.target.value)}
                            placeholder="เช่น 5000000"
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button type="button" variant="ghost" onClick={() => setPersonalTargetForm(null)}
                            className="flex-1 h-10 rounded-xl text-slate-500 text-sm">
                            ยกเลิก
                          </Button>
                          <Button type="submit" disabled={savingPersonalTarget}
                            className="flex-[2] h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold border-0 shadow-md shadow-violet-500/20 flex items-center justify-center gap-2">
                            {savingPersonalTarget && <Loader2 size={13} className="animate-spin" />}
                            <Save size={13} /> บันทึก
                          </Button>
                        </div>
                      </form>
                    )}
                  </Card>
                </div>
              )}

              {/* ── Users (admin only) ── */}
              {activeSection === 'users' && isAdmin && (
                <Card className="p-6 rounded-3xl border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                      <ShieldCheck size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">ผู้ใช้งานในระบบ</h3>
                      <p className="text-xs text-slate-400">{allProfiles.length} บัญชี — เฉพาะ admin เห็นหน้านี้</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {allProfiles.map(profile => {
                      const isSelf = profile.id === user?.id;
                      const isProfileAdmin = profile.role === 'admin';
                      return (
                        <div key={profile.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                            isProfileAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
                          )}>
                            {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {profile.full_name || profile.email}
                              </p>
                              {isSelf && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">คุณ</span>}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                isProfileAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
                              )}>
                                {isProfileAdmin ? 'Admin' : 'Member'}
                              </span>
                              {profile.last_seen_at && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(profile.last_seen_at).toLocaleDateString('th-TH')}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isSelf && (
                            <select
                              value={profile.role}
                              onChange={e => updateRole.mutate({ id: profile.id, role: e.target.value })}
                              disabled={updateRole.isPending}
                              className="h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none cursor-pointer text-slate-600 shrink-0"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm delete team member */}
      <ConfirmDialog
        open={confirmDeleteMember.open}
        onOpenChange={(open) => setConfirmDeleteMember({ open, id: open ? confirmDeleteMember.id : null, name: confirmDeleteMember.name })}
        title={`ลบ ${confirmDeleteMember.name}`}
        description="การดำเนินการนี้จะลบสมาชิกออกจากทีมถาวร"
        confirmLabel="ลบ"
        onConfirm={() => {
          if (confirmDeleteMember.id) deleteMember.mutate(confirmDeleteMember.id);
        }}
      />
    </div>
  );
}
