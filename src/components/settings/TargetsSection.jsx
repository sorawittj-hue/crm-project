import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatFullCurrency } from '../../lib/formatters';
import { useToast } from '../ui/Toast';
import { Pencil, Save, Loader2, Target } from 'lucide-react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';

export function TargetsSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { success, error } = useToast();

  const { openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const [targetForm, setTargetForm] = useState(null);
  const [savingTargets, setSavingTargets] = useState(false);

  const initTargetForm = () => setTargetForm({
    monthly_target: settings?.monthly_target ?? 10000000,
  });

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      setTargetForm(null);
      return;
    }
    setSavingTargets(true);
    try {
      await updateSettings.mutateAsync({
        monthly_target: Number(targetForm.monthly_target),
      });
      success('บันทึกเป้าหมายยอดขายสำเร็จ');
      setTargetForm(null);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการบันทึกเป้าหมาย: ' + err.message);
    } finally {
      setSavingTargets(false);
    }
  };

  return (
    <Card className="p-8 rounded-xl bg-white/60 dark:bg-[#192629]/80  border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">เป้าหมายยอดขาย</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">กำหนดเป้าหมายรายเดือนของทีม</p>
        </div>
        {!targetForm && (
          <Button
            onClick={initTargetForm}
            className="h-9 px-4 rounded-xl text-sm bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <Pencil size={13} className="mr-1.5" /> แก้ไข
          </Button>
        )}
      </div>

      {!targetForm ? (
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-gradient-to-r from-teal-50 to-white dark:from-teal-950/30 dark:to-[#171926] border border-teal-100 dark:border-teal-800/40 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-300">
                <Target size={20} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">เป้าหมายรวมทีม (ต่อเดือน)</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-teal-700 dark:text-teal-400">{formatFullCurrency(settings?.monthly_target)}</p>
          </div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 px-2">
            💡 เป้าหมายยอดขายส่วนตัวของแต่ละคน สามารถตั้งค่าแยกได้ที่หน้า <span className="font-bold text-teal-600 dark:text-teal-400">บัญชีผู้ใช้</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSaveTargets} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">เป้าหมายรวมทีม (บาท/เดือน)</label>
            <Input
              type="number"
              value={targetForm.monthly_target}
              onChange={(e) => setTargetForm({ ...targetForm, monthly_target: e.target.value })}
              className="h-11 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#171926] text-slate-900 dark:text-white text-sm font-bold"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTargetForm(null)}
              className="flex-1 h-10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 text-sm cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={savingTargets}
              className="flex-[2] h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold border-0 shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingTargets && <Loader2 size={13} className="animate-spin" />}
              <Save size={13} /> บันทึก
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
