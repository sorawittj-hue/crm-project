import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation dialog for destructive actions
 */
export default function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title = 'Confirm Action',
  description = 'Are you sure? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
  onConfirm,
  isLoading = false
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[2.5rem] p-8 border-0 shadow-2xl">
        <DialogHeader className="mb-6 text-center">
          <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mb-4 mx-auto ${
            variant === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
          }`}>
            <AlertTriangle size={32} />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            {title}
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {description}
          </p>
        </DialogHeader>

        <DialogFooter className="flex gap-3 mt-4">
          <Button 
            variant="ghost" 
            className="flex-1 h-12 rounded-full font-black text-[10px] uppercase tracking-widest"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button 
            className={`flex-1 h-12 rounded-full font-black text-[10px] uppercase tracking-widest ${
              variant === 'danger' 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
