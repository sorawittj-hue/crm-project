import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Reusable confirmation dialog for destructive actions
 */
export default function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title = 'ยืนยันการดำเนินการ',
  description = 'คุณแน่ใจหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'danger', // 'danger' | 'warning'
  onConfirm,
  isLoading = false
}) {
  const isDanger = variant === 'danger';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl relative bg-white/95 backdrop-blur-3xl">
        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

        {/* Animated Top color ribbon */}
        <div className={cn(
          "h-1.5 w-full relative overflow-hidden",
          isDanger ? 'bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600' : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500'
        )}>
          <motion.div
            className="absolute inset-0 bg-white/40"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        </div>

        <div className="p-8 relative z-10">
          <DialogHeader className="mb-6 text-center">
            {/* Animated icon with glow */}
            <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className={cn(
                  "absolute -inset-3 blur-2xl opacity-30 rounded-full",
                  isDanger ? 'bg-rose-500' : 'bg-amber-500'
                )}
              />
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 250 }}
                className={cn(
                  "relative w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl",
                  isDanger 
                    ? 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/30' 
                    : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30'
                )}
              >
                {isDanger
                  ? <Trash2 size={32} strokeWidth={2.5} />
                  : <AlertTriangle size={32} strokeWidth={2.5} />
                }
              </motion.div>
            </div>

            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-center">
              {title}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed text-center px-2">
              {description}
            </p>
          </DialogHeader>

          <DialogFooter className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl font-bold text-sm text-slate-600 bg-white border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all shadow-sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button 
              className={cn(
                "flex-1 h-12 rounded-xl font-bold text-sm text-white border-0 transition-all",
                isDanger 
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-[0_4px_16px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)]' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)]'
              )}
              onClick={() => {
                onConfirm?.();
                if (!isLoading) {
                  // If there is an async operation, onOpenChange might be handled by parent,
                  // but we close optimistically if it's not a loading state action.
                  // Actually, better to let the parent handle close or close it immediately if not loading.
                  if (!isLoading) onOpenChange(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  กำลังดำเนินการ...
                </div>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
