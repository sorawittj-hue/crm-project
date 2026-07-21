import { useState } from 'react';
import { CheckCircle2, DollarSign, Calendar, Building2, AlignLeft, Loader2, Zap } from 'lucide-react';
import { useAddDeal } from '../../hooks/useDeals';
import { useAppStore } from '../../store/useAppStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

export default function GlobalAddDealModal() {
  const { isQuickAddOpen, closeQuickAdd } = useAppStore();
  const addDealMutation = useAddDeal();

  const [form, setForm] = useState({
    title: '',
    value: '',
    company: '',
    stage: 'lead',
    actual_close_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.value) return;

    try {
      await addDealMutation.mutateAsync({
        title: form.title,
        value: Number(form.value),
        company: form.company,
        actual_close_date: form.actual_close_date,
        description: form.description,
        stage: form.stage,
        probability: form.stage === 'won' ? 100 : form.stage === 'lead' ? 10 : form.stage === 'contact' ? 30 : form.stage === 'proposal' ? 50 : 80,
        source: 'direct',
      });
      
      setForm({
        title: '',
        value: '',
        company: '',
        stage: 'lead',
        actual_close_date: new Date().toISOString().split('T')[0],
        description: '',
      });
      closeQuickAdd();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isQuickAddOpen} onOpenChange={closeQuickAdd}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-3xl border-0 shadow-2xl rounded-[2rem] relative">
        {/* Header Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-600" />
        
        <div className="p-7">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                <Zap size={20} className="fill-current" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight">สร้างดีลใหม่ด่วน (Quick Add)</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-400">
                  เพิ่มข้อมูล Deal ใหม่เข้าสู่ Pipeline ได้ทันที
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อรายการ / สินค้า *</label>
              <div className="relative">
                <AlignLeft className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <Input
                  required
                  placeholder="เช่น ซื้อไลเซนส์ 5 User, ลูกค้า Walk-in"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50/60 border-slate-200/80 rounded-xl text-xs font-semibold focus:bg-white focus:border-violet-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">มูลค่ายอดขาย *</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={15} />
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50/60 border-slate-200/80 rounded-xl font-black text-base text-slate-900 focus:bg-white focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ขั้นตอนเริ่มต้น</label>
                <select
                  value={form.stage}
                  onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                  className="w-full h-11 bg-slate-50/60 border border-slate-200/80 rounded-xl px-3 text-xs font-semibold outline-none focus:border-violet-400 focus:bg-white"
                >
                  <option value="lead">ลูกค้าใหม่ (Lead)</option>
                  <option value="contact">นัดเจอ (Contact)</option>
                  <option value="proposal">เสนอราคา (Proposal)</option>
                  <option value="negotiation">กำลังปิด (Negotiation)</option>
                  <option value="won">ปิดได้ (Won)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">คาดว่าจะปิด</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <Input
                    type="date"
                    required
                    value={form.actual_close_date}
                    onChange={e => setForm(f => ({ ...f, actual_close_date: e.target.value }))}
                    className="pl-10 h-11 bg-slate-50/60 border-slate-200/80 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อลูกค้า / บริษัท</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <Input
                  placeholder="เช่น บริษัท เอสซีจี จำกัด"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50/60 border-slate-200/80 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเหตุ (ถ้ามี)</label>
              <Textarea
                rows={2}
                placeholder="รายละเอียดเพิ่มเติม..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="bg-slate-50/60 border-slate-200/80 rounded-xl text-xs font-medium resize-none focus:bg-white"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs font-bold" onClick={closeQuickAdd}>
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={addDealMutation.isPending || !form.title || !form.value}
                className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20"
              >
                {addDealMutation.isPending ? <Loader2 className="animate-spin mr-1.5" size={15} /> : <CheckCircle2 className="mr-1.5" size={15} />}
                สร้างดีลใหม่
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
