import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatFullCurrency } from '../../lib/formatters';
import { useToast } from '../ui/Toast';
import { Pencil, Save, Loader2 } from 'lucide-react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';

export function TargetsSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { success, error } = useToast();

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
      success('บันทึกเป้าหมายยอดขายสำเร็จ');
      setTargetForm(null);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการบันทึกเป้าหมาย: ' + err.message);
    } finally {
      setSavingTargets(false);
    }
  };

  return (
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
  );
}
