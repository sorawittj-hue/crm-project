import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { Pencil, Save, Loader2 } from 'lucide-react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { useMyProfile } from '../../hooks/useUserProfiles';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';

export function CompanySection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { success, error } = useToast();
  const { user } = useAuth();
  const { openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const [companyForm, setCompanyForm] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const initCompanyForm = () => setCompanyForm({
    company_name: settings?.company_name ?? '',
    company_industry: settings?.company_industry ?? '',
    currency: settings?.currency ?? 'THB',
  });

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      setCompanyForm(null);
      return;
    }
    setSavingCompany(true);
    try {
      await updateSettings.mutateAsync(companyForm);
      success('บันทึกข้อมูลบริษัทสำเร็จ');
      setCompanyForm(null);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการบันทึกข้อมูลบริษัท: ' + err.message);
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight relative z-10">บริษัท</h2>
          <p className="text-sm font-medium text-slate-500 mt-1 relative z-10">ข้อมูลบริษัทและการตั้งค่าระบบพื้นฐาน</p>
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
  );
}
