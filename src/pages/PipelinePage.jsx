import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
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

  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Auto-reset customer search query when modal opens or closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setCustomerSearch('');
      setIsCustomerDropdownOpen(false);
    } else if (newDeal.customer_id) {
      const c = customers.find(x => x.id === newDeal.customer_id);
      if (c) {
        setCustomerSearch(c.name + (c.company ? ` (${c.company})` : ''));
      }
    }
  }, [isAddModalOpen, newDeal.customer_id, customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

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
        <DialogContent className="max-w-4xl lg:max-w-5xl bg-white rounded-3xl p-8 border-0 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-6 border-b border-slate-100 pb-4">
             <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <Plus size={20} className="text-violet-600" />
               <span>เพิ่มดีลการขายใหม่</span>
             </DialogTitle>
             <p className="text-xs text-slate-400 mt-0.5">กรอกข้อมูลเพื่อบันทึกดีลและวิเคราะห์โอกาสชนะด้วย AI</p>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* Left side: Form (Column Span 7) */}
             <div className="lg:col-span-7 space-y-5">
                 {/* Customer selector (Search Autocomplete) */}
                 <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      ลูกค้าในระบบ (เชื่อมโยงเพื่อกรอกข้อมูลติดต่ออัตโนมัติ)
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="🔍 พิมพ์เพื่อค้นหาลูกค้า เช่น ชื่อ หรือชื่อบริษัท..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setIsCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-violet-400 transition-all text-sm font-semibold"
                      />
                      {customerSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerSearch('');
                            setIsCustomerDropdownOpen(false);
                            setNewDeal(prev => ({
                              ...prev,
                              customer_id: '',
                              company: '',
                              contact: '',
                              contact_phone: '',
                              contact_email: '',
                            }));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        >
                          ล้าง
                        </button>
                      )}
                    </div>

                    {isCustomerDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsCustomerDropdownOpen(false)} />
                        <div className="absolute left-4 right-4 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-150 rounded-xl shadow-xl z-20 py-1.5 custom-scrollbar">
                          {filteredCustomers.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">ไม่พบรายชื่อลูกค้า</div>
                          ) : (
                            filteredCustomers.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setCustomerSearch(c.name + (c.company ? ` (${c.company})` : ''));
                                  setIsCustomerDropdownOpen(false);
                                  setNewDeal(prev => ({
                                    ...prev,
                                    customer_id: c.id,
                                    company: c.company || c.name || '',
                                    contact: c.name || '',
                                    contact_phone: c.phone || '',
                                    contact_email: c.email || '',
                                  }));
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-violet-50 text-xs font-semibold text-slate-700 flex flex-col gap-0.5 border-b border-slate-50 last:border-0"
                              >
                                <span className="text-slate-900 font-bold">{c.name}</span>
                                {c.company && <span className="text-slate-400 text-[10px]">{c.company}</span>}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                 </div>

                 {/* Primary info */}
                 <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                       <h4 className="text-xs font-black uppercase tracking-wider text-violet-600">ข้อมูลดีลหลัก</h4>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-500">ชื่อดีล *</label>
                       <Input
                          required
                          placeholder="เช่น โปรเจกต์ติดตั้งระบบ"
                          value={newDeal.title}
                          onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:bg-white focus:border-violet-400"
                       />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">ชื่อบริษัท / องค์กร *</label>
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
                             className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:bg-white focus:border-violet-400"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">มูลค่าดีล (บาท) *</label>
                          <Input
                             required
                             type="number"
                             placeholder="0"
                             value={newDeal.value}
                             onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                             className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-black focus:bg-white text-violet-700 focus:border-violet-400"
                          />
                       </div>
                    </div>

                    {/* Stage Buttons */}
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-slate-500">ขั้นตอนปัจจุบัน</label>
                       <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'lead', label: 'ลูกค้าใหม่', color: 'bg-slate-400', activeBg: 'bg-slate-100 border-slate-400 text-slate-900' },
                            { id: 'contact', label: 'นัดเจอ', color: 'bg-amber-500', activeBg: 'bg-amber-50 border-amber-500 text-amber-900' },
                            { id: 'proposal', label: 'เสนอราคา', color: 'bg-sky-500', activeBg: 'bg-sky-50 border-sky-500 text-sky-900' },
                            { id: 'negotiation', label: 'กำลังปิด', color: 'bg-violet-500', activeBg: 'bg-violet-50 border-violet-500 text-violet-900' },
                            { id: 'won', label: 'ปิดได้', color: 'bg-emerald-500', activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-900' },
                            { id: 'lost', label: 'ปิดไม่ได้', color: 'bg-rose-500', activeBg: 'bg-rose-50 border-rose-500 text-rose-900' }
                          ].map((stage) => {
                            const isActive = newDeal.stage === stage.id;
                            return (
                              <button
                                key={stage.id}
                                type="button"
                                onClick={() => {
                                  const stageProbMap = {
                                    lead: 10,
                                    contact: 30,
                                    proposal: 60,
                                    negotiation: 80,
                                    won: 100,
                                    lost: 0,
                                  };
                                  const autoProb = stageProbMap[stage.id] ?? 50;
                                  setNewDeal({
                                    ...newDeal,
                                    stage: stage.id,
                                    probability: String(autoProb),
                                  });
                                }}
                                className={cn(
                                  "flex items-center justify-center gap-1.5 h-10 px-2 rounded-xl border text-center transition-all duration-200 text-xs font-semibold",
                                  isActive
                                    ? cn("border-2 shadow-sm", stage.activeBg)
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                )}
                              >
                                <span className={cn("w-2 h-2 rounded-full", stage.color)} />
                                <span>{stage.label}</span>
                              </button>
                            );
                          })}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">โอกาสปิด (%)</label>
                          <Input
                             type="number"
                             min="0"
                             max="100"
                             placeholder="50"
                             value={newDeal.probability}
                             onChange={(e) => setNewDeal({...newDeal, probability: e.target.value})}
                             className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:bg-white focus:border-violet-400"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">วันคาดว่าจะปิด</label>
                          <input
                             type="date"
                             value={newDeal.expected_close_date}
                             onChange={(e) => setNewDeal({...newDeal, expected_close_date: e.target.value})}
                             className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 focus:bg-white transition-all text-sm font-bold text-slate-800"
                          />
                       </div>
                    </div>

                    {teamMembers.length > 0 && (
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">ผู้รับผิดชอบดีล</label>
                          <select
                             value={newDeal.assigned_to}
                             onChange={(e) => setNewDeal({ ...newDeal, assigned_to: e.target.value })}
                             className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 focus:bg-white transition-all text-sm font-semibold"
                          >
                             <option value="">— ไม่ระบุ —</option>
                             {teamMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}{m.role ? ` (${m.role})` : ''}</option>
                             ))}
                          </select>
                       </div>
                    )}
                 </div>

                 {/* Contact info */}
                 <div className="space-y-4 pt-2">
                    <div className="border-b border-slate-100 pb-2">
                       <h4 className="text-xs font-black uppercase tracking-wider text-violet-600">ข้อมูลผู้ติดต่อประสานงาน</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">ชื่อผู้ติดต่อ</label>
                          <Input
                             placeholder="ระบุชื่อจริง/ชื่อเล่น"
                             value={newDeal.contact}
                             onChange={(e) => setNewDeal({...newDeal, contact: e.target.value})}
                             className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-violet-400"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">เบอร์โทรศัพท์</label>
                          <Input
                             placeholder="เช่น 089-XXX-XXXX"
                             value={newDeal.contact_phone}
                             onChange={(e) => setNewDeal({...newDeal, contact_phone: e.target.value})}
                             className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-violet-400"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">อีเมล</label>
                          <Input
                             type="email"
                             placeholder="เช่น name@company.com"
                             value={newDeal.contact_email}
                             onChange={(e) => setNewDeal({...newDeal, contact_email: e.target.value})}
                             className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-violet-400"
                          />
                       </div>
                    </div>
                 </div>

                 {formError && (
                    <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600">
                      ⚠️ {formError}
                    </div>
                 )}

                 <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
                    <Button
                       type="button"
                       variant="ghost"
                       disabled={addDealMutation.isPending}
                       onClick={() => setIsAddModalOpen(false)}
                       className="flex-1 h-11 rounded-xl text-sm text-slate-500 font-semibold"
                    >
                       ยกเลิก
                    </Button>
                    <Button
                       type="submit"
                       disabled={addDealMutation.isPending}
                       className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                       {addDealMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                       {addDealMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกดีล'}
                    </Button>
                 </div>
             </div>

             {/* Right side: Live Preview and AI Guidance (Column Span 5) */}
             <div className="lg:col-span-5 bg-slate-50/80 p-6 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-6 max-h-[75vh] overflow-y-auto">
                 <div className="space-y-5">
                    <div>
                       <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                         <span>👀 Live Card Preview</span>
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                       </h4>
                       <p className="text-[10px] text-slate-400 mt-0.5">การ์ดของคุณจะแสดงบนบอร์ด Kanban ดังนี้:</p>
                    </div>

                    {/* Kanban Deal Card Mock */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-3 pointer-events-none relative overflow-hidden">
                       <div className="flex items-start justify-between gap-2">
                         <div className="min-w-0 flex-1">
                           <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                             {newDeal.company || 'ยังไม่ระบุชื่อบริษัท'}
                           </p>
                           <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-snug">
                             {newDeal.title || 'กรอกชื่อดีลเพื่อสร้างพรีวิว'}
                           </p>
                         </div>
                         <div className="flex items-center gap-1 shrink-0">
                           <span className={cn(
                             "w-2.5 h-2.5 rounded-full",
                             newDeal.stage === 'won' ? 'bg-emerald-500' :
                             newDeal.stage === 'lost' ? 'bg-rose-500' :
                             newDeal.stage === 'negotiation' ? 'bg-violet-500' :
                             newDeal.stage === 'proposal' ? 'bg-sky-500' :
                             newDeal.stage === 'contact' ? 'bg-amber-500' : 'bg-slate-400'
                           )} />
                         </div>
                       </div>

                       <div className="flex items-baseline justify-between gap-2 pt-1">
                         <span className="text-base font-black text-slate-955 tabular-nums leading-none">
                           {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(newDeal.value) || 0)}
                         </span>
                         <span className="text-xs font-bold text-slate-700">
                           {newDeal.probability || '50'}%
                         </span>
                       </div>

                       <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                         <div className="w-6 h-6 rounded-full bg-slate-900/10 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-700 shrink-0">
                           {newDeal.assigned_to ? (teamMembers.find(t => t.id === newDeal.assigned_to)?.name?.charAt(0).toUpperCase() || 'U') : 'U'}
                         </div>
                         <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div
                             className={cn(
                               "h-full rounded-full transition-all duration-500",
                               Number(newDeal.probability) >= 70 ? 'bg-emerald-500' :
                               Number(newDeal.probability) >= 40 ? 'bg-slate-900' : 'bg-slate-350'
                             )}
                             style={{ width: `${Math.max(0, Math.min(100, Number(newDeal.probability) || 0))}%` }}
                           />
                         </div>
                       </div>
                    </div>
                 </div>

                 {/* AI Guidance Box */}
                 <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-xl space-y-2.5 mt-auto">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
                       <Zap size={12} className="text-violet-600 fill-violet-200" />
                       <span>การวิเคราะห์ของ AI ผู้ช่วยการขาย</span>
                    </h5>
                    <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                       {(() => {
                         const val = Number(newDeal.value) || 0;
                         const stage = newDeal.stage;
                         const expClose = newDeal.expected_close_date;
                         const assignee = newDeal.assigned_to;
                         const tips = [];

                         if (val >= 1000000) {
                           tips.push("ดีลมีมูลค่าสูงมาก (High-Value) ควรเฝ้าระวังไม่ให้ขาดกิจกรรมการคุยนานเกิน 7 วัน!");
                         } else if (val > 0 && val < 50000) {
                           tips.push("ดีลขนาดเล็ก (Fast-Track) แนะนำให้เร่งส่งข้อเสนอราคาเพื่อปิดงานด่วน");
                         }

                         if (stage === 'lead') {
                           tips.push("ขั้นตอน 'ลูกค้าใหม่': แนะนำโทรนัดหมายและระบุความต้องการให้ชัดเจน");
                         } else if (stage === 'negotiation') {
                           tips.push("ขั้นตอน 'กำลังปิด': ดีลนี้เกือบสำเร็จแล้ว แนะนำเตรียมใบเสนอราคา PO ล่าสุดให้พร้อม");
                         }

                         if (!expClose) {
                           tips.push("ยังไม่ได้ใส่วันคาดปิด: แนะนำระบุเพื่อให้บอร์ดวิเคราะห์ยอดขายล่วงหน้าได้");
                         }

                         if (!assignee) {
                           tips.push("ยังไม่ได้ตั้งคนรับผิดชอบ ดีลจะถูกส่งเข้าดีลส่วนกลาง");
                         }

                         if (tips.length === 0) {
                           return <p className="text-slate-400">กรอกข้อมูลดีลด้านซ้ายเพื่อประเมินความเสี่ยงและคำแนะนำจาก AI แบบทันที</p>;
                         }

                         return (
                           <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-medium text-[11px]">
                             {tips.map((tip, idx) => (
                               <li key={idx}>{tip}</li>
                             ))}
                           </ul>
                         );
                       })()}
                    </div>
                 </div>
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
