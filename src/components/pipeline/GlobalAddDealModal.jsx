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
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-violet-100 shadow-2xl">
        {/* Header Ribbon */}
        <div className="h-2 bg-gradient-to-r from-violet-400 to-indigo-600" />
        
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Zap size={20} className="fill-current" />
              </div>
              <div>
                <DialogTitle className="text-xl">เพิ่มข้อมูลด่วน (Quick Add)</DialogTitle>
                <DialogDescription>สร้าง Deal ใหม่เข้าสู่ Pipeline ได้ทันทีจากทุกที่</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อรายการ / สินค้า *</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  required
                  placeholder="เช่น ซื้อไลเซนส์ 5 User, ลูกค้า Walk-in"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="pl-9 h-11 bg-slate-50/50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">มูลค่ายอดขาย *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  className="pl-9 h-11 bg-slate-50/50 border-slate-200 font-bold text-lg text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">สถานะเริ่มต้น</label>
                <select
                  value={form.stage}
                  onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                  className="w-full h-11 bg-slate-50/50 border border-slate-200 rounded-xl px-3 text-sm font-semibold outline-none focus:border-violet-400"
                >
                  <option value="lead">Lead</option>
                  <option value="contact">Contact</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">วันปิดดีลโดยประมาณ</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    type="date"
                    required
                    value={form.actual_close_date}
                    onChange={e => setForm(f => ({ ...f, actual_close_date: e.target.value }))}
                    className="pl-9 h-11 bg-slate-50/50 border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อลูกค้า / บริษัท</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="บริษัทลูกค้า"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="pl-9 h-11 bg-slate-50/50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">หมายเหตุ (ถ้ามี)</label>
              <Textarea
                rows={2}
                placeholder="รายละเอียดเพิ่มเติม..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="bg-slate-50/50 border-slate-200 resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeQuickAdd}
                className="text-slate-500"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={addDealMutation.isPending || !form.title || !form.value}
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
              >
                {addDealMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <CheckCircle2 size={16} className="mr-2" />
                )}
                สร้างดีลใหม่
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
