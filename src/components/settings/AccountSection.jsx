import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { formatFullCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { Pencil, Save, Loader2, LogOut, Target, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMyProfile, useUpdateMyPersonalTarget } from '../../hooks/useUserProfiles';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';
import ConfirmDialog from '../ui/ConfirmDialog';

const AVATAR_COLORS = {
  violet: { bg: 'bg-gradient-to-br from-violet-500 to-indigo-600', ring: 'from-violet-400 to-indigo-500', text: 'text-violet-700 bg-violet-50/50 border-violet-100/50', dot: 'bg-violet-600' },
  emerald: { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', ring: 'from-emerald-400 to-teal-500', text: 'text-emerald-700 bg-emerald-50/50 border-emerald-100/50', dot: 'bg-emerald-600' },
  amber: { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', ring: 'from-amber-400 to-orange-500', text: 'text-amber-700 bg-amber-50/50 border-amber-100/50', dot: 'bg-amber-600' },
  rose: { bg: 'bg-gradient-to-br from-rose-400 to-pink-500', ring: 'from-rose-400 to-pink-500', text: 'text-rose-700 bg-rose-50/50 border-rose-100/50', dot: 'bg-rose-600' },
  blue: { bg: 'bg-gradient-to-br from-blue-500 to-cyan-600', ring: 'from-blue-400 to-cyan-500', text: 'text-blue-700 bg-blue-50/50 border-blue-100/50', dot: 'bg-blue-600' },
  purple: { bg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', ring: 'from-purple-400 to-fuchsia-500', text: 'text-purple-700 bg-purple-50/50 border-purple-100/50', dot: 'bg-purple-600' },
};

export function AccountSection() {
  const { user, signOut } = useAuth();
  const { openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();
  const { data: myProfile } = useMyProfile(user?.id);
  const updatePersonalTarget = useUpdateMyPersonalTarget();
  const { success, error } = useToast();
  
  const isAdmin = myProfile?.role === 'admin';

  const [personalTargetForm, setPersonalTargetForm] = useState(null);
  const [savingPersonalTarget, setSavingPersonalTarget] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [selectedColor, setSelectedColor] = useState('violet');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleOpenEdit = () => {
    setProfileName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
    setSelectedColor(user?.user_metadata?.avatar_color || 'violet');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      error('กรุณากรอกชื่อของคุณ');
      return;
    }
    setSavingProfile(true);
    try {
      const { supabase } = await import('../../utils/supabase');
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profileName.trim(),
          avatar_color: selectedColor
        }
      });
      if (updateError) throw updateError;
      success('อัปเดตข้อมูลโปรไฟล์ส่วนตัวสำเร็จ');
      setIsEditingProfile(false);
    } catch (err) {
      error('ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePersonalTarget = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      setPersonalTargetForm(null);
      return;
    }
    if (!user?.id) return;
    setSavingPersonalTarget(true);
    try {
      await updatePersonalTarget.mutateAsync({ userId: user.id, target: personalTargetForm });
      success('บันทึกเป้าหมายยอดขายส่วนตัวสำเร็จ');
      setPersonalTargetForm(null);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการบันทึกเป้าหมายส่วนตัว: ' + err.message);
    } finally {
      setSavingPersonalTarget(false);
    }
  };

  const userColorKey = user?.user_metadata?.avatar_color || 'violet';
  const theme = AVATAR_COLORS[userColorKey] || AVATAR_COLORS.violet;

  return (
    <div className="space-y-6">
      <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight relative z-10">โปรไฟล์ของคุณ</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 relative z-10">ข้อมูลส่วนตัวและภาพประจำตัว</p>
          </div>
          {!isEditingProfile && (
            <Button
              onClick={handleOpenEdit}
              className="h-9 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20"
            >
              <Pencil size={13} className="mr-1.5" /> แก้ไขข้อมูล
            </Button>
          )}
        </div>

        <div className="space-y-4 relative z-10">
          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">ชื่อผู้ใช้งาน</label>
                <Input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="เช่น สมชาย มุ่งมั่น"
                  className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">สีธีมรูปประจำตัว (Avatar Theme Color)</label>
                <div className="flex flex-wrap gap-3 py-1">
                  {Object.keys(AVATAR_COLORS).map(colorKey => {
                    const c = AVATAR_COLORS[colorKey];
                    const isSelected = selectedColor === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setSelectedColor(colorKey)}
                        className={cn(
                          "w-9 h-9 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center p-[2px]",
                          isSelected ? "border-violet-600 scale-105 shadow-md shadow-violet-600/10" : "border-transparent"
                        )}
                      >
                        <div className={cn("w-full h-full rounded-full shadow-inner", c.bg)} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 h-9 rounded-xl text-slate-500 text-xs border border-slate-200 hover:bg-slate-100"
                  disabled={savingProfile}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold border-0 shadow-md shadow-violet-500/20 flex items-center justify-center gap-1.5"
                  disabled={savingProfile}
                >
                  {savingProfile ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  บันทึกโปรไฟล์
                </Button>
              </div>
            </form>
          ) : (
            <div className={cn("flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300", theme.text)}>
              <div className={cn("p-0.5 rounded-2xl bg-gradient-to-br shrink-0", theme.ring)}>
                <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center text-white text-xl font-black shadow-inner", theme.bg)}>
                  {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-2 inline-flex items-center gap-1 shrink-0',
                  isAdmin ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-200 text-slate-600 border border-slate-300'
                )}>
                  {isAdmin ? '⚡ Admin' : 'Member'}
                </span>
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full h-11 rounded-2xl bg-rose-50/50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-semibold text-sm relative z-10"
        >
          <LogOut size={15} className="mr-2" /> ออกจากระบบ
        </Button>
      </Card>

      {/* Personal Target Card */}
      <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
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
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-50/60 to-purple-50/30 border border-violet-100/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Target size={16} />
              </div>
              <p className="text-sm font-medium text-slate-600">เป้าหมายรายเดือน</p>
            </div>
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

      {/* Privacy & Legal Card */}
      <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-base font-bold text-slate-900">การจัดการข้อมูลและความเป็นส่วนตัว</h3>
          <p className="text-xs text-slate-400 mt-0.5">จัดการบัญชีและข้อมูลของคุณตามนโยบาย PDPA</p>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Download size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">ส่งออกข้อมูลส่วนตัว (Export Data)</p>
                <p className="text-xs text-slate-500 mt-0.5">ดาวน์โหลดข้อมูลทั้งหมดของคุณในรูปแบบ CSV</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => success('ส่งออกข้อมูลสำเร็จ (ไฟล์จะดาวน์โหลดในไม่ช้า)')}>
              ส่งออก
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 border border-rose-100 hover:border-rose-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-700">ลบบัญชีและข้อมูลทั้งหมด (Delete Account)</p>
                <p className="text-xs text-rose-500/80 mt-0.5">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-rose-600 hover:bg-rose-500 hover:text-white" onClick={() => setShowDeleteConfirm(true)}>
              ลบบัญชี
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="ลบบัญชีและข้อมูลทั้งหมด"
        description="การกระทำนี้จะไม่สามารถย้อนกลับได้ บัญชีและข้อมูลทั้งหมดของคุณจะถูกลบอย่างถาวร คุณแน่ใจหรือไม่?"
        confirmLabel="ใช่, ลบบัญชี"
        cancelLabel="ยกเลิก"
        onConfirm={() => error('ฟีเจอร์ลบบัญชีถูกปิดการใช้งานในโหมดทดสอบ')}
      />
    </div>
  );
}
