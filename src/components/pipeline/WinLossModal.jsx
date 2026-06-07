import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../lib/utils';

/**
 * WinLossModal — shared modal for capturing win/loss reason when closing a deal.
 * Used by both PipelineBoard (drag-drop) and DealDetailSidebar (action buttons).
 *
 * Props:
 *   open        — boolean
 *   targetStage — 'won' | 'lost' | null
 *   onClose     — () => void   (cancel / dismiss)
 *   onConfirm   — (reason: string) => void
 */
export default function WinLossModal({ open, targetStage, onClose, onConfirm }) {
  const getTodayLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const [reason, setReason] = useState('');
  const [closeDate, setCloseDate] = useState(getTodayLocalDate());
  const [touched, setTouched] = useState(false);

  const isWon = targetStage === 'won';
  const tooShort = reason.trim().length < 5;

  const handleOpenChange = (val) => {
    if (!val) {
      setReason('');
      setTouched(false);
      setCloseDate(getTodayLocalDate());
      onClose?.();
    }
  };

  const handleConfirm = () => {
    setTouched(true);
    if (tooShort) return;
    onConfirm?.(reason.trim(), closeDate);
    setReason('');
    setTouched(false);
    setCloseDate(getTodayLocalDate());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-8 border-0 shadow-2xl">
        <DialogHeader className="mb-6 items-center text-center">
          {/* Icon */}
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
              isWon
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-500'
            )}
          >
            {isWon ? (
              <CheckCircle2 size={30} />
            ) : (
              <XCircle size={30} />
            )}
          </div>

          <DialogTitle className={cn(
            'text-xl font-bold text-center',
            isWon ? 'text-emerald-700' : 'text-rose-700'
          )}>
            {isWon ? '🎉 ยินดีด้วย! ปิดดีลสำเร็จ' : 'ดีลไม่สำเร็จ'}
          </DialogTitle>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            ระบุเหตุผลสั้นๆ เพื่อปรับปรุงกลยุทธ์การขาย
          </p>
        </DialogHeader>

        {/* Reason textarea */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 ml-1">
            เหตุผลการปิดดีล
            <span className="text-rose-400 ml-1">*</span>
          </label>
          <Textarea
            placeholder={
              isWon
                ? 'เช่น ราคาดีกว่าคู่แข่ง, ความสัมพันธ์ที่ดี, ตอบสนองเร็ว...'
                : 'เช่น งบประมาณไม่พอ, เลือกเจ้าอื่น, ยกเลิกโปรเจกต์...'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[110px] rounded-2xl bg-slate-50 border-slate-200 resize-none p-4 font-medium text-sm"
            autoFocus
          />
          {touched && tooShort && (
            <p className="text-xs text-rose-500 ml-1">
              กรุณาระบุให้ชัดเจนขึ้น (อย่างน้อย 5 ตัวอักษร)
            </p>
          )}
        </div>

        {/* Close Date picker */}
        <div className="space-y-2 mt-4">
          <label className="text-xs font-semibold text-slate-600 ml-1">
            วันที่ปิดดีล
            <span className="text-rose-400 ml-1">*</span>
          </label>
          <input
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
            className="w-full h-11 px-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:border-slate-400 outline-none"
            required
          />
        </div>

        <DialogFooter className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl h-11 text-sm text-slate-500"
            onClick={() => handleOpenChange(false)}
          >
            ยกเลิก
          </Button>
          <Button
            className={cn(
              'flex-1 rounded-xl h-11 text-sm font-semibold text-white border-0 shadow-md',
              isWon
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
            )}
            onClick={handleConfirm}
          >
            {isWon ? (
              <><ThumbsUp size={14} className="mr-2" />ยืนยันปิดได้</>
            ) : (
              <><ThumbsDown size={14} className="mr-2" />ยืนยันปิดไม่ได้</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
