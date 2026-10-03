import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Briefcase, Zap, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './Dialog';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';

const STAGE_LABELS = {
  lead: 'ลูกค้าใหม่', contact: 'นัดเจอ', proposal: 'เสนอราคา',
  negotiation: 'กำลังปิด', won: 'ปิดได้', lost: 'ปิดไม่ได้',
};

export default function GlobalSearch({ deals = [], customers = [], onNavigate, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 1) return { deals: [], customers: [] };
    return {
      deals: deals.filter(d =>
        d.title?.toLowerCase().includes(q) || d.company?.toLowerCase().includes(q)
      ).slice(0, 5),
      customers: customers.filter(c =>
        c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
      ).slice(0, 4),
    };
  }, [query, deals, customers]);

  const hasResults = results.deals.length > 0 || results.customers.length > 0;

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose?.(); }} className="max-w-xl">
      <DialogContent showCloseButton={false} className="max-h-[85dvh] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/98 p-0 shadow-2xl shadow-slate-900/30 dark:border-white/10 dark:bg-[#111522]/98">
        <DialogTitle className="sr-only">ค้นหาดีลและลูกค้า</DialogTitle>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search size={18} className="text-violet-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหาดีล, ลูกค้า..."
            className="flex-1 text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:block text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
            <button type="button" onClick={onClose} aria-label="ปิดการค้นหา" className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {!query && (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                <Zap size={22} className="text-violet-400" />
              </div>
              <p className="text-sm font-bold text-slate-400">พิมพ์เพื่อค้นหา</p>
              <p className="text-xs text-slate-300 mt-1">ค้นหาดีล, ลูกค้า, ชื่อบริษัท</p>
            </div>
          )}
          {query && !hasResults && (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-slate-400">ไม่พบ &quot;{query}&quot;</p>
            </div>
          )}
          {results.deals.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">ดีล</p>
              {results.deals.map(deal => (
                <button key={deal.id} onClick={() => { onNavigate?.('deal', deal); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-violet-50 group transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Briefcase size={15} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{deal.title}</p>
                    <p className="text-xs text-slate-400 truncate">{deal.company} · {STAGE_LABELS[deal.stage] || deal.stage}</p>
                  </div>
                  <p className="text-sm font-black text-slate-900 shrink-0">{formatCurrency(deal.value)}</p>
                  <ArrowRight size={13} className="text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
          {results.customers.length > 0 && (
            <div className={cn('p-3', results.deals.length > 0 && 'border-t border-slate-100')}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">ลูกค้า</p>
              {results.customers.map(c => (
                <button key={c.id} onClick={() => { onNavigate?.('customer', c); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-violet-50 group transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 text-white text-sm font-black">
                    {(c.name || c.company || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.name || c.company}</p>
                    <p className="text-xs text-slate-400 truncate">{c.company}</p>
                  </div>
                  <ArrowRight size={13} className="text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-slate-100 flex items-center gap-3">
          <kbd className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">Ctrl K</kbd>
          <span className="text-[11px] text-slate-300">/</span>
          <kbd className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
          <span className="text-[11px] text-slate-400">ปิด</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
