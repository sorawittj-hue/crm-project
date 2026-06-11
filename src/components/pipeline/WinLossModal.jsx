import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Trophy, XCircle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../lib/utils';

const WIN_PRESETS = [
  'ราคาดีกว่าคู่แข่ง',
  'ความสัมพันธ์ที่ดีกับลูกค้า',
  'ตอบสนองเร็วและเป็นมืออาชีพ',
  'สินค้า/บริการตรงความต้องการ',
  'Demo โดนใจ',
];

const LOSS_PRESETS = [
  'งบประมาณไม่พอ',
  'เลือกเจ้าอื่น / คู่แข่งราคาถูกกว่า',
  'ยกเลิก/เลื่อนโปรเจกต์',
  'ติดต่อไม่ได้ / ไม่มีการตอบรับ',
  'ข้อกำหนดเงื่อนไขไม่ตรงกัน',
];

/**
 * WinLossModal — shared modal for capturing win/loss reason when closing a deal.
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
  const presets = isWon ? WIN_PRESETS : LOSS_PRESETS;

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

  const handlePreset = (preset) => {
    setReason(prev => prev ? `${prev}, ${preset}` : preset);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        {/* Gradient Header */}
        <div className={cn(
          'px-8 pt-8 pb-6 text-white',
          isWon
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
            : 'bg-gradient-to-br from-rose-500 to-rose-700'
        )}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.05 }}
            className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
          >
            {isWon ? <Trophy size={28} className="text-yellow-200" /> : <XCircle size={28} />}
          </motion.div>

          <h2 className="text-2xl font-black tracking-tight leading-tight">
            {isWon ? '🎉 ยินดีด้วย! ปิดดีลสำเร็จ' : 'บันทึกดีลไม่สำเร็จ'}
          </h2>
          <p className={cn('text-sm mt-1.5 leading-relaxed', isWon ? 'text-emerald-100' : 'text-rose-100')}>
            ระบุเหตุผลเพื่อช่วยวิเคราะห์และพัฒนากลยุทธ์การขาย
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Preset Chips */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={12} className="text-violet-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">เลือกเหตุผลด่วน</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105',
                    isWon
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Reason textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              เหตุผล <span className="text-rose-400">*</span>
            </label>
            <Textarea
              placeholder={
                isWon
                  ? 'คลิกด่วนด้านบน หรือพิมพ์รายละเอียดเพิ่มเติม...'
                  : 'คลิกด่วนด้านบน หรือพิมพ์รายละเอียดเพิ่มเติม...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[90px] rounded-xl bg-slate-50 border-slate-200 resize-none p-4 text-sm"
              autoFocus
            />
            {touched && tooShort && (
              <p className="text-xs text-rose-500 font-medium">
                กรุณาระบุให้ชัดเจนขึ้น (อย่างน้อย 5 ตัวอักษร)
              </p>
            )}
          </div>

          {/* Close Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              วันที่ปิดดีล <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:bg-white outline-none transition-all"
              required
            />
          </div>

          <DialogFooter className="mt-2 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl h-11 text-sm text-slate-500 border border-slate-200 hover:bg-slate-50"
              onClick={() => handleOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              className={cn(
                'flex-1 rounded-xl h-11 text-sm font-bold text-white border-0 shadow-md',
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
