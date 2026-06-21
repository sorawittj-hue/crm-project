import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { formatFullCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { Plus, Check, X, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeam, useAddTeamMember, useUpdateTeamMember, useDeleteTeamMember } from '../../hooks/useTeam';
import ConfirmDialog from '../ui/ConfirmDialog';

import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';

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

const EMPTY_MEMBER = { name: '', role: '', goal: '', color: 'bg-violet-600' };

export function TeamSection() {
  const { data: teamMembers = [] } = useTeam();
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const { success, error } = useToast();

  const { openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({});
  const [confirmDeleteMember, setConfirmDeleteMember] = useState({ open: false, id: null, name: '' });

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    if (!newMember.name.trim()) return;
    try {
      await addMember.mutateAsync({
        ...newMember,
        goal: Number(newMember.goal) || 0,
      });
      success('เพิ่มสมาชิกในทีมสำเร็จ');
      setNewMember(EMPTY_MEMBER);
      setAddingMember(false);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการเพิ่มสมาชิก: ' + err.message);
    }
  };

  const handleUpdateMember = async (id) => {
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    try {
      await updateMember.mutateAsync({
        id,
        ...editMemberForm,
        goal: Number(editMemberForm.goal) || 0,
      });
      success('อัปเดตข้อมูลสมาชิกสำเร็จ');
      setEditingMemberId(null);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการอัปเดตสมาชิก: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight relative z-10 flex items-center gap-2">
              ทีมงาน
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">{teamMembers.length} คน</span>
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 relative z-10">จัดการสมาชิกและเป้าหมายรายบุคคล</p>
          </div>
          <Button
            onClick={() => {
              if (shouldBlockBasic) {
                openPaywall(isGuestAccount ? 'default' : 'trial_ended');
              } else {
                setAddingMember(true);
                setNewMember(EMPTY_MEMBER);
              }
            }}
            className="h-9 px-4 rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20 font-bold flex items-center gap-1.5"
          >
            <Plus size={13} className="mr-1.5" /> เพิ่มสมาชิก
          </Button>
        </div>

        <div className="space-y-3">
          {teamMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-gradient-to-r hover:from-violet-50/40 hover:to-white hover:border-violet-100 hover:shadow-sm transition-all group"
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
                  <div className={cn('p-0.5 rounded-xl shrink-0', m.color ? m.color.replace('bg-', 'bg-gradient-to-br from-').concat('/80 to-', m.color.replace('bg-', '')) : 'bg-gradient-to-br from-violet-500 to-violet-700')}>
                    <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-bold text-base', m.color || 'bg-violet-600')}>
                      {m.name.charAt(0)}
                    </div>
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
                      onClick={() => {
                        if (shouldBlockBasic) {
                          openPaywall(isGuestAccount ? 'default' : 'trial_ended');
                        } else {
                          setEditingMemberId(m.id);
                          setEditMemberForm({ name: m.name, role: m.role, goal: m.goal, color: m.color });
                        }
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (shouldBlockBasic) {
                          openPaywall(isGuestAccount ? 'default' : 'trial_ended');
                        } else {
                          setConfirmDeleteMember({ open: true, id: m.id, name: m.name });
                        }
                      }}
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
            <div className="text-center py-14">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-violet-400" />
              </div>
              <p className="text-sm font-bold text-slate-600">ยังไม่มีสมาชิกในทีม</p>
              <p className="text-xs text-slate-400 mt-1">กดปุ่ม &ldquo;เพิ่มสมาชิก&rdquo; เพื่อเริ่มสร้างทีมขาย</p>
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

      <ConfirmDialog
        open={confirmDeleteMember.open}
        onOpenChange={(open) => setConfirmDeleteMember({ open, id: open ? confirmDeleteMember.id : null, name: confirmDeleteMember.name })}
        title={`ลบ ${confirmDeleteMember.name}`}
        description="การดำเนินการนี้จะลบสมาชิกออกจากทีมถาวร"
        confirmLabel="ลบ"
        onConfirm={() => {
          if (shouldBlockBasic) {
            openPaywall(isGuestAccount ? 'default' : 'trial_ended');
            setConfirmDeleteMember({ open: false, id: null, name: '' });
            return;
          }
          if (confirmDeleteMember.id) {
            deleteMember.mutate(confirmDeleteMember.id, {
              onSuccess: () => success('ลบสมาชิกออกจากทีมสำเร็จ'),
              onError: (err) => error('เกิดข้อผิดพลาดในการลบสมาชิก: ' + err.message)
            });
          }
        }}
      />
    </div>
  );
}
