import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Phone, Mail, Clock, FileText, CheckCircle2, Loader2, CalendarClock } from 'lucide-react';
import { useAddActivity } from '../../hooks/useActivities';
import { cn } from '../../lib/utils';

const ACTIVITY_TYPES = [
  { id: 'call', label: 'โทร', icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'email', label: 'อีเมล', icon: Mail, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'meeting', label: 'ประชุม', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'note', label: 'โน้ต', icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200' },
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
      
      // 1. Log the completed activity
      await addActivityMutation.mutateAsync({
        deal_id: deal.id,
        customer_id: deal.customer_id,
        type: type,
        title: `บันทึก: ${typeLabel}`,
        description: note,
        completed_at: new Date().toISOString(),
      });
      
      // 2. Add follow up task if checked
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
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Quick Log Activity</DialogTitle>
            <DialogDescription>บันทึกการคุยกับ {deal.company || deal.title}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div className="flex gap-2">
              {ACTIVITY_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-2 px-1 border rounded-xl gap-1 transition-all",
                    type === t.id ? t.color + " shadow-sm ring-1 ring-current" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <t.icon size={16} />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายละเอียด</label>
              <Textarea
                rows={3}
                placeholder="คุยเรื่องอะไร ผลเป็นอย่างไร..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-slate-50/50 border-slate-200 resize-none text-sm"
                required
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input 
                  type="checkbox" 
                  checked={setFollowUp} 
                  onChange={e => setSetFollowUp(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4 border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <CalendarClock size={16} className="text-violet-500" />
                  ตั้งแจ้งเตือน Follow-up งานนี้ต่อ
                </span>
              </label>

              {setFollowUp && (
                <div className="ml-6 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">วันที่ต้องทำ</label>
                  <Input
                    type="date"
                    required={setFollowUp}
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="h-9 bg-slate-50 border-slate-200 text-sm"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
              <Button 
                type="submit" 
                disabled={addActivityMutation.isPending || !note}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
              >
                {addActivityMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={16} />}
                บันทึก Log
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
