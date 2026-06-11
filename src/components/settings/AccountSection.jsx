import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { formatFullCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { Pencil, Save, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMyProfile, useUpdateMyPersonalTarget } from '../../hooks/useUserProfiles';

export function AccountSection() {
  const { user, signOut } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  const updatePersonalTarget = useUpdateMyPersonalTarget();
  const { success, error } = useToast();
  
  const isAdmin = myProfile?.role === 'admin';

  const [personalTargetForm, setPersonalTargetForm] = useState(null);
  const [savingPersonalTarget, setSavingPersonalTarget] = useState(false);

  const handleSavePersonalTarget = async (e) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6">
      <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight relative z-10">โปรไฟล์ของคุณ</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 relative z-10">ข้อมูลส่วนตัวและรหัสผ่าน</p>
          </div>
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
  );
}
