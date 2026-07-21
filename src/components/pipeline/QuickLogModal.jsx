import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Phone, Mail, Clock, FileText, CheckCircle2, Loader2, CalendarClock, MessageSquare } from 'lucide-react';
import { useAddActivity } from '../../hooks/useActivities';
import { cn } from '../../lib/utils';

const ACTIVITY_TYPES = [
  { id: 'call', label: 'โทรศัพท์', icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'email', label: 'อีเมล', icon: Mail, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'meeting', label: 'ประชุม', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'note', label: 'โน้ตย่อ', icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export default function QuickLogModal({ open, onOpenChange, deal }) {
  const addActivityMutation = useAddActivity();
  const [type, setType] = useState('call');
  const [note, setNote] = useState('');
  const [setFollowUp, setSetFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deal) return;

    try {
      const typeLabel = ACTIVITY_TYPES.find(t => t.id === type)?.label || type;
      
      await addActivityMutation.mutateAsync({
        deal_id: deal.id,
        customer_id: deal.customer_id,
        type: type,
        title: `บันทึก: ${typeLabel}`,
        description: note,
        completed_at: new Date().toISOString(),
      });
      
      if (setFollowUp && followUpDate) {
        await addActivityMutation.mutateAsync({
          deal_id: deal.id,
          customer_id: deal.customer_id,
          type: 'task',
          title: `Follow up: ${deal.company || deal.title}`,
          description: note,
          scheduled_at: new Date(followUpDate).toISOString(),
        });
      }

      setNote('');
      setSetFollowUp(false);
      setFollowUpDate('');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-3xl border-0 shadow-2xl rounded-[2rem] relative">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600" />
        <div className="p-7">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <MessageSquare size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight">บันทึกกิจกรรม (Quick Log)</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-400">
                  {deal.company || deal.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-5">
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2.5 px-1 border rounded-2xl gap-1 transition-all duration-200",
                    type === t.id
                      ? `${t.color} shadow-sm ring-2 ring-violet-400/20 font-black`
                      : "border-slate-200/80 text-slate-500 hover:bg-slate-50 font-medium"
                  )}
                >
                  <t.icon size={16} />
                  <span className="text-[10px]">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายละเอียดการพูดคุย *</label>
              <Textarea
                rows={3}
                placeholder="ระบุข้อสรุป ผลการพูดคุย หรือประเด็นสำคัญ..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-slate-50/60 border-slate-200/80 rounded-2xl text-xs font-medium resize-none focus:bg-white focus:border-violet-400"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100/80 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={setFollowUp} 
                  onChange={e => setSetFollowUp(e.target.checked)}
                  className="rounded-lg text-violet-600 focus:ring-violet-500 w-4 h-4 border-slate-300"
                />
                <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <CalendarClock size={15} className="text-violet-500" />
                  ตั้งแจ้งเตือน Follow-up งานนี้ต่อ
                </span>
              </label>

              {setFollowUp && (
                <div className="ml-6 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่กำหนดนัดหมาย</label>
                  <Input
                    type="date"
                    required={setFollowUp}
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="h-10 bg-slate-50/60 border-slate-200/80 rounded-xl text-xs font-semibold"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs font-bold" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={addActivityMutation.isPending || !note}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
              >
                {addActivityMutation.isPending ? <Loader2 className="animate-spin mr-1.5" size={15} /> : <CheckCircle2 className="mr-1.5" size={15} />}
                บันทึกกิจกรรม
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
