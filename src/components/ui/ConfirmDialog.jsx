import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

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
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Top color ribbon */}
        <div className={`h-1.5 w-full ${isDanger ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} />

        <div className="p-8">
          <DialogHeader className="mb-6 text-center">
            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto ${
                isDanger ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
              }`}
            >
              {isDanger
                ? <Trash2 size={28} />
                : <AlertTriangle size={28} />
              }
            </motion.div>

            <DialogTitle className="text-xl font-bold text-slate-900 text-center">
              {title}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed text-center">
              {description}
            </p>
          </DialogHeader>

          <DialogFooter className="flex gap-3 mt-2">
            <Button 
              variant="ghost" 
              className="flex-1 h-11 rounded-xl font-semibold text-sm text-slate-600 border border-slate-200 hover:bg-slate-50"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button 
              className={`flex-1 h-11 rounded-xl font-bold text-sm text-white border-0 shadow-md ${
                isDanger 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' 
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
              }`}
              onClick={() => {
                onConfirm?.();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
