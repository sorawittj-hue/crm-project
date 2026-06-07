import { useState, useMemo, lazy, Suspense } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useAddMultipleDeals, useDeleteDeals } from '../hooks/useDeals';
import { useCustomers } from '../hooks/useCustomers';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Sliders, ScanLine, Download, User, Zap, Loader2, ChevronDown, Search } from 'lucide-react';

// Lazy-load PDFImporter to avoid bundling pdfjs-dist (~5MB) in initial load
const PDFImporter = lazy(() => import('../components/pipeline/PDFImporter'));
import { STAGES } from '../lib/constants';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../components/ui/Dialog';

export default function PipelinePage() {
  const { data: deals, isLoading, error } = useDeals();
  const { data: customers = [] } = useCustomers();
  const { data: teamMembers = [] } = useTeam();
  const updateDealMutation = useUpdateDeal();
  const addDealMutation = useAddDeal();
  const addMultipleDealsMutation = useAddMultipleDeals();
  const deleteDealsMutation = useDeleteDeals();
  const { pendingOpenDeal, clearPendingOpenDeal } = useAppStore();
  const { user } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [myDealsOnly, setMyDealsOnly] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [quickDeal, setQuickDeal] = useState({ company: '', title: '', value: '', expected_close_date: '' });
  const [quickError, setQuickError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [newDeal, setNewDeal] = useState({
    title: '', company: '', value: '', stage: 'lead', customer_id: '',
    contact: '', contact_email: '', contact_phone: '', probability: '50',
    expected_close_date: '', assigned_to: '',
  });

  // CSV export helper
  const exportToCSV = () => {
    const headers = ['ชื่อดีล', 'บริษัท', 'มูลค่า', 'ขั้นตอน', 'โอกาสปิด%', 'ผู้ติดต่อ', 'วันสร้าง', 'วันคาดปิด'];
    const rows = filteredDeals.map(d => [
      d.title || '', d.company || '', d.value || 0, d.stage || '',
      d.probability || 0, d.contact || '',
      d.created_at ? new Date(d.created_at).toLocaleDateString('th-TH') : '',
      d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString('th-TH') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `deals_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredDeals = useMemo(() => {
    let result = deals || [];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.title?.toLowerCase().includes(s) ||
        d.company?.toLowerCase().includes(s) ||
        d.contact?.toLowerCase().includes(s)
      );
    }
    if (myDealsOnly && user?.id) result = result.filter(d => d.assigned_to === user.id);
    return result;
  }, [deals, searchTerm, myDealsOnly, user?.id]);

  const [formError, setFormError] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (addDealMutation.isPending) return;
    setFormError(null);
    try {
      const isClosed = ['won', 'lost'].includes(newDeal.stage);
      await addDealMutation.mutateAsync({
        ...newDeal,
        value: Number(newDeal.value) || 0,
        probability: Number(newDeal.probability) || 50,
        expected_close_date: newDeal.expected_close_date || null,
        actual_close_date: isClosed ? (newDeal.expected_close_date ? new Date(newDeal.expected_close_date + 'T12:00:00').toISOString() : new Date().toISOString()) : null,
        assigned_to: newDeal.assigned_to || null,
      });
      setIsAddModalOpen(false);
      setNewDeal({ title: '', company: '', value: '', stage: 'lead', customer_id: '', contact: '', contact_email: '', contact_phone: '', probability: '50', expected_close_date: '', assigned_to: '' });
    } catch (err) {
      setFormError(err?.message || 'ไม่สามารถบันทึกดีลได้ กรุณาลองใหม่');
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickDeal.title && !quickDeal.company) { setQuickError('ใส่ชื่อดีลหรือบริษัทอย่างน้อย 1 อย่าง'); return; }
    setQuickError(null);
    try {
      await addDealMutation.mutateAsync({
        title: quickDeal.title || quickDeal.company,
        company: quickDeal.company,
        value: Number(quickDeal.value) || 0,
        stage: 'lead',
        probability: 50,
        expected_close_date: quickDeal.expected_close_date || null,
      });
      setQuickDeal({ company: '', title: '', value: '', expected_close_date: '' });
      setIsQuickAddOpen(false);
    } catch (err) {
      setQuickError(err?.message || 'ไม่สามารถบันทึกได้');
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-sm text-slate-400">กำลังโหลดดีล...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center bg-rose-50 border border-rose-100 rounded-[2rem] space-y-4 max-w-lg mx-auto mt-20">
      <h3 className="text-xl font-bold text-rose-900">โหลดข้อมูลไม่สำเร็จ</h3>
      <p className="text-sm text-rose-600/80 font-medium">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง</p>
      <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl border-rose-200">ลองใหม่</Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-0"
    >
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ดีลทั้งหมด</h1>
            <p className="text-sm text-slate-500 mt-1">จัดการและติดตามดีลในทุกขั้นตอน</p>
          </div>
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              placeholder="ค้นหาดีล บริษัท หรือผู้ติดต่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full rounded-xl border-slate-200 bg-white shadow-sm text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          {/* Ghost actions */}
          <button
            onClick={() => setMyDealsOnly(v => !v)}
            className={cn(
              'h-9 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
              myDealsOnly
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            )}
          >
            <User size={13} /> ดีลของฉัน
          </button>
          <button
            onClick={exportToCSV}
            className="h-9 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <Download size={13} /> CSV
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 hidden md:block" />

          {/* Dropdown Menu for secondary tools (Quick Add & Scan PDF) */}
          <div className="relative">
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={cn(
                'h-9 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                isToolsOpen && 'border-slate-350 bg-slate-50 text-slate-900 shadow-sm'
              )}
            >
              <Zap size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
              <span>เครื่องมือ AI</span>
              <ChevronDown size={12} className={cn('transition-transform', isToolsOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {isToolsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsToolsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-150 rounded-xl shadow-lg py-1.5 z-50 origin-top-right"
                  >
                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        setIsQuickAddOpen(true);
                        setQuickError(null);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                    >
                      <Zap size={12} className="text-amber-500 fill-amber-500" />
                      <span>Quick Add (บันทึกด่วน)</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        setIsScanOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                    >
                      <Sliders size={12} className="text-violet-500" />
                      <span>สแกนใบเสนอราคา (PDF)</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-4 rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20 flex items-center gap-1.5 font-bold"
          >
            <Plus size={13} /> เพิ่มดีลใหม่
          </Button>
        </div>
      </header>

      {/* QUICK ADD DIALOG */}
      <Dialog open={isQuickAddOpen} onOpenChange={(v) => { setIsQuickAddOpen(v); if (!v) { setQuickDeal({ company: '', title: '', value: '', expected_close_date: '' }); setQuickError(null); } }}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                <Zap size={15} className="text-white" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">Quick Add Deal</DialogTitle>
            </div>
            <p className="text-xs text-slate-400">เพิ่มดีลด่วน — กรอกแค่สิ่งสำคัญ</p>
          </DialogHeader>

          <form onSubmit={handleQuickAdd} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">ชื่อบริษัท</label>
              <Input
                placeholder="เช่น บริษัท ABC จำกัด"
                value={quickDeal.company}
                onChange={e => setQuickDeal(q => ({ ...q, company: e.target.value }))}
                className="h-10 rounded-xl text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">มูลค่า (บาท)</label>
              <Input
                type="number"
                placeholder="500000"
                value={quickDeal.value}
                onChange={e => setQuickDeal(q => ({ ...q, value: e.target.value }))}
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">วันคาดว่าจะปิด</label>
              <input
                type="date"
                value={quickDeal.expected_close_date}
                onChange={e => setQuickDeal(q => ({ ...q, expected_close_date: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-amber-400 transition-all text-sm"
              />
            </div>
            {quickError && (
              <p className="text-xs text-rose-500 font-medium">{quickError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex-1 h-10 rounded-xl text-sm text-slate-500"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={addDealMutation.isPending}
                className="flex-[2] h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold border-0 shadow-sm disabled:opacity-60"
              >
                {addDealMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : 'บันทึกด่วน ⚡'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>



      <MonthlyPipeline
        deals={filteredDeals}
        onAddDeal={(data) => {
          if (data) addDealMutation.mutate(data);
          else setIsAddModalOpen(true);
        }}
        onUpdateDeal={(id, updates) => updateDealMutation.mutate({ id, ...updates })}
        onDeleteDeal={(id) => deleteDealsMutation.mutate([id])}
        pendingOpenDeal={pendingOpenDeal}
        onPendingOpenDealHandled={clearPendingOpenDeal}
      />

      {/* ADD ASSET MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 border-0 shadow-2xl">
          <DialogHeader className="mb-4">
             <DialogTitle className="text-lg font-bold text-slate-900">เพิ่มดีลใหม่</DialogTitle>
             <p className="text-xs text-slate-400 mt-0.5">กรอกรายละเอียดดีลที่ต้องการเพิ่ม</p>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3">
             {/* Customer selector */}
             <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">ลูกค้า (ถ้ามีในระบบ)</label>
                <select
                   value={newDeal.customer_id}
                   onChange={(e) => {
                     const cid = e.target.value;
                     const c = customers.find(x => x.id === cid);
                     setNewDeal({ ...newDeal, customer_id: cid, company: c?.company || c?.name || newDeal.company });
                   }}
                   className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 transition-all text-sm"
                >
                   <option value="">— ไม่เลือกลูกค้า —</option>
                   {customers.map(c => (
                     <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                   ))}
                </select>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500">ชื่อดีล *</label>
                   <Input
                      required
                      placeholder="เช่น โปรเจกต์ติดตั้งระบบ"
                      value={newDeal.title}
                      onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                      className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500">บริษัท *</label>
                   <Input
                      required
                      placeholder="เช่น บริษัท ABC จำกัด"
                      value={newDeal.company}
                      onChange={(e) => {
                        const company = e.target.value;
                        const matched = customers.find(c =>
                          c.company?.toLowerCase() === company.toLowerCase() ||
                          c.name?.toLowerCase() === company.toLowerCase()
                        );
                        setNewDeal({
                          ...newDeal,
                          company,
                          customer_id: matched ? matched.id : newDeal.customer_id,
                        });
                      }}
                      className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                   />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">มูลค่า (บาท) *</label>
                    <Input
                       required
                       type="number"
                       placeholder="0"
                       value={newDeal.value}
                       onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                       className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">ขั้นตอน</label>
                    <select
                       value={newDeal.stage}
                       onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})}
                       className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 transition-all text-sm"
                    >
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
             </div>
             {/* Assigned to */}
             {teamMembers.length > 0 && (
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500">รับผิดชอบโดย</label>
                 <select
                   value={newDeal.assigned_to}
                   onChange={(e) => setNewDeal({ ...newDeal, assigned_to: e.target.value })}
                   className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 transition-all text-sm"
                 >
                   <option value="">— ไม่ระบุ —</option>
                   {teamMembers.map(m => (
                     <option key={m.id} value={m.id}>{m.name}{m.role ? ` (${m.role})` : ''}</option>
                   ))}
                 </select>
               </div>
             )}

             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">โอกาสปิด (%)</label>
                    <Input
                       type="number"
                       min="0"
                       max="100"
                       placeholder="50"
                       value={newDeal.probability}
                       onChange={(e) => setNewDeal({...newDeal, probability: e.target.value})}
                       className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">วันคาดว่าจะปิด</label>
                    <input
                       type="date"
                       value={newDeal.expected_close_date}
                       onChange={(e) => setNewDeal({...newDeal, expected_close_date: e.target.value})}
                       className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 transition-all text-sm"
                    />
                </div>
             </div>
             <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500">ผู้ติดต่อ</label>
                   <Input
                      placeholder="ชื่อ"
                      value={newDeal.contact}
                      onChange={(e) => setNewDeal({...newDeal, contact: e.target.value})}
                      className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                   />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">เบอร์โทร</label>
                    <Input
                       placeholder="0XX-XXX-XXXX"
                       value={newDeal.contact_phone}
                       onChange={(e) => setNewDeal({...newDeal, contact_phone: e.target.value})}
                       className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">อีเมล</label>
                    <Input
                       type="email"
                       placeholder="email@co.com"
                       value={newDeal.contact_email}
                       onChange={(e) => setNewDeal({...newDeal, contact_email: e.target.value})}
                       className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                    />
                </div>
             </div>

             {formError && (
                <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600">
                  {formError}
                </div>
             )}

             <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={addDealMutation.isPending}
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-10 rounded-xl text-sm text-slate-500"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={addDealMutation.isPending}
                  className="flex-[2] h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addDealMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  {addDealMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกดีล'}
                </Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SYNC MODAL */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[3.5rem] bg-white border-0 shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-10 text-center">
              <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                 <ScanLine size={32} />
              </div>
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI Quote Scanner</DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-10">Automatic AI extraction of deal details from multiple quote PDFs.</p>
            </DialogHeader>
            
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center p-12 gap-4">
                <Loader2 className="animate-spin text-violet-500" size={28} />
                <p className="text-sm text-slate-400">กำลังโหลด AI Scanner...</p>
              </div>
            }>
              <PDFImporter
                onDataExtracted={(data) => { 
                  setIsScanOpen(false); 
                  if (Array.isArray(data)) {
                    addMultipleDealsMutation.mutate(data);
                  } else {
                    addDealMutation.mutate(data); 
                  }
                }}
                onClose={() => setIsScanOpen(false)}
              />
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
