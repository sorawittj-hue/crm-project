import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, DollarSign, Calendar, Building2, AlignLeft, Loader2, Zap } from 'lucide-react';
import { useAddDeal } from '../../hooks/useDeals';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

export default function QuickWinModal({ open, onOpenChange }) {
  const addDealMutation = useAddDeal();

  const [form, setForm] = useState({
    title: '',
    value: '',
    company: '',
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
        stage: 'won',
        probability: 100,
        source: 'direct',
      });
      
      setForm({
        title: '',
        value: '',
        company: '',
        actual_close_date: new Date().toISOString().split('T')[0],
        description: '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-emerald-100 shadow-2xl">
        {/* Header Ribbon */}
        <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Zap size={20} className="fill-current" />
              </div>
              <div>
                <DialogTitle className="text-xl">บันทึกยอดด่วน (Quick Win)</DialogTitle>
                <DialogDescription>บันทึกยอดขายที่ปิดได้ทันทีโดยไม่ต้องผ่านท่อขายปกติ</DialogDescription>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">วันที่ปิดยอด</label>
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
                onClick={() => onOpenChange(false)}
                className="text-slate-500"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={addDealMutation.isPending || !form.title || !form.value}
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              >
                {addDealMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <CheckCircle2 size={16} className="mr-2" />
                )}
                บันทึกยอดขาย
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
