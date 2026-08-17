import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { Pencil, Save, Loader2, Building2, Briefcase, Banknote, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';

export function CompanySection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { success, error } = useToast();

  const { openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const [companyForm, setCompanyForm] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const initCompanyForm = () => setCompanyForm({
    company_name: settings?.company_name ?? '',
    company_industry: settings?.company_industry ?? '',
    currency: settings?.currency ?? 'THB',
    disable_ai: settings?.disable_ai ?? false,
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
    <Card className="p-8 rounded-[2rem] bg-white/60 dark:bg-[#0f111a]/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight relative z-10">บริษัท</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 relative z-10">ข้อมูลบริษัทและการตั้งค่าระบบพื้นฐาน</p>
        </div>
        {!companyForm && (
          <Button
            onClick={initCompanyForm}
            className="h-9 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20 cursor-pointer"
          >
            <Pencil size={13} className="mr-1.5" /> แก้ไข
          </Button>
        )}
      </div>

      {!companyForm ? (
        <div className="space-y-4 relative z-10">
          {[
            { label: 'ชื่อบริษัท', value: settings?.company_name || '—', icon: Building2, gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-100 dark:border-white/[0.06]', border: 'border-l-violet-400', iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300' },
            { label: 'อุตสาหกรรม', value: settings?.company_industry || '—', icon: Briefcase, gradient: 'from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/20 border-blue-100 dark:border-white/[0.06]', border: 'border-l-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' },
            { label: 'สกุลเงิน', value: settings?.currency || 'THB', icon: Banknote, gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border-emerald-100 dark:border-white/[0.06]', border: 'border-l-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' },
          ].map((item) => (
            <div key={item.label} className={cn('flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r border border-l-4 transition-all hover:shadow-md cursor-default', item.gradient, item.border)}>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.iconBg)}>
                <item.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSaveCompany} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">ชื่อบริษัท</label>
            <Input
              placeholder="เช่น บริษัท XYZ จำกัด"
              value={companyForm.company_name}
              onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
              className="h-11 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#171926] text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">อุตสาหกรรม</label>
            <Input
              placeholder="เช่น Technology, Manufacturing"
              value={companyForm.company_industry}
              onChange={(e) => setCompanyForm({ ...companyForm, company_industry: e.target.value })}
              className="h-11 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#171926] text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">สกุลเงิน</label>
            <select
              value={companyForm.currency}
              onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
              className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#171926] text-slate-900 dark:text-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 transition-all appearance-none cursor-pointer"
            >
              <option value="THB">THB — บาทไทย</option>
              <option value="USD">USD — ดอลลาร์</option>
              <option value="SGD">SGD — ดอลลาร์สิงคโปร์</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl border border-rose-150 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/30 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 text-rose-500 dark:text-rose-400 flex items-center justify-center shadow-sm border border-rose-100 dark:border-rose-800/40">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">ปิดการใช้งาน AI</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ระบบจะไม่ส่งข้อมูลและไม่สร้างเนื้อหาอัตโนมัติด้วย AI</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={companyForm.disable_ai}
                onChange={(e) => setCompanyForm({ ...companyForm, disable_ai: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCompanyForm(null)}
              className="flex-1 h-10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 text-sm cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={savingCompany}
              className="flex-[2] h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold border-0 shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer"
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
