import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useAddMultipleDeals, useDeleteDeals } from '../hooks/useDeals';
import { useCustomers } from '../hooks/useCustomers';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useDebounce } from '../hooks/useDebounce';
import { useAppStore } from '../store/useAppStore';
import { useAddActivity } from '../hooks/useActivities';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Sliders, ScanLine, Download, User, Zap, Loader2, ChevronDown, Search, Briefcase, Calendar, Building2, Sparkles, UserCheck, Smile, DollarSign, Check, Phone, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const addActivityMutation = useAddActivity();
  const { pendingOpenDeal, clearPendingOpenDeal, pendingNewDealCustomer, clearPendingNewDealCustomer, openPaywall } = useAppStore();
  const { user } = useAuth();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const handleUpdateDeal = async (id, updates) => {
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    const originalDeal = (deals || []).find(d => d.id === id);
    if (originalDeal && updates.stage && updates.stage !== originalDeal.stage) {
      const nextStage = updates.stage;
      try {
        let taskTitle = '';
        let taskDesc = '';
        let daysAhead = 0;

        if (nextStage === 'proposal') {
          taskTitle = '📝 ส่งและติดตามใบเสนอราคา';
          taskDesc = `ระบบอัตโนมัติ: ดีลย้ายสู่ขั้นตอน 'เสนอราคา' กรุณาจัดส่งเอกสารใบเสนอราคาให้ครบถ้วน และโทรติดตามสอบถามผลภายใน 3 วัน`;
          daysAhead = 3;
        } else if (nextStage === 'negotiation') {
          taskTitle = '🤝 เจรจาปิดสัญญา / ติดตาม PO';
          taskDesc = `ระบบอัตโนมัติ: ดีลย้ายสู่ขั้นตอน 'กำลังปิด' กรุณาติดตามสัญญาหรือใบสั่งซื้อ (PO) และยืนยันข้อตกลงกับผู้มีอำนาจตัดสินใจ`;
          daysAhead = 3;
        } else if (nextStage === 'won') {
          taskTitle = '⚙️ ดำเนินการออกใบแจ้งหนี้ (Invoice) & ส่งมอบงาน';
          taskDesc = `ระบบอัตโนมัติ: ดีลสำเร็จแล้ว! กรุณาออก Invoice และประสานงานทีมส่งมอบสินค้า/บริการตามข้อตกลง`;
          daysAhead = 1;
        } else if (nextStage === 'lost') {
          taskTitle = '📊 วิเคราะห์สาเหตุและทบทวนใน 3 เดือน';
          taskDesc = `ระบบอัตโนมัติ: ดีลปิดไม่ได้ (Lost) บันทึกสาเหตุและตั้งเตือนเพื่อตรวจสอบโอกาสติดต่อใหม่อีกครั้งใน 3-6 เดือน`;
          daysAhead = 90;
        }

        if (taskTitle) {
          const scheduledAt = new Date();
          scheduledAt.setDate(scheduledAt.getDate() + daysAhead);
          scheduledAt.setHours(9, 0, 0, 0);

          await addActivityMutation.mutateAsync({
            deal_id: id,
            type: 'task',
            title: taskTitle,
            description: taskDesc,
            scheduled_at: scheduledAt.toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to trigger automatic task:', err);
      }
    }

    updateDealMutation.mutate({ id, ...updates });
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTab, setFormTab] = useState('details'); // details, contact
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [myDealsOnly, setMyDealsOnly] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [quickDeal, setQuickDeal] = useState({ company: '', title: '', value: '', expected_close_date: '' });
  const [quickError, setQuickError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
      setFormTab('details');
    } else if (newDeal.customer_id) {
      const c = customers.find(x => x.id === newDeal.customer_id);
      if (c) {
        setCustomerSearch(c.name + (c.company ? ` (${c.company})` : ''));
      }
    }
  }, [isAddModalOpen, newDeal.customer_id, customers]);

  // Handle redirect from CustomersPage creating a new deal
  useEffect(() => {
    if (pendingNewDealCustomer) {
      setNewDeal({
        title: `ดีลสำหรับ ${pendingNewDealCustomer.company || pendingNewDealCustomer.name}`,
        company: pendingNewDealCustomer.company || pendingNewDealCustomer.name || '',
        value: '',
        stage: 'lead',
        customer_id: pendingNewDealCustomer.id,
        contact: pendingNewDealCustomer.name || '',
        contact_email: pendingNewDealCustomer.email || '',
        contact_phone: pendingNewDealCustomer.phone || '',
        probability: '10', // 10% for new lead stage
        expected_close_date: '',
        assigned_to: '',
      });
      setCustomerSearch(pendingNewDealCustomer.name + (pendingNewDealCustomer.company ? ` (${pendingNewDealCustomer.company})` : ''));
      setIsAddModalOpen(true);
      clearPendingNewDealCustomer();
    }
  }, [pendingNewDealCustomer, clearPendingNewDealCustomer]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
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
    if (debouncedSearchTerm) {
      const s = debouncedSearchTerm.toLowerCase();
      result = result.filter(d =>
        (d.title || '').toLowerCase().includes(s) ||
        (d.company || '').toLowerCase().includes(s) ||
        (d.contact || '').toLowerCase().includes(s)
      );
    }
    if (myDealsOnly && user?.id) result = result.filter(d => d.assigned_to === user.id);
    return result;
  }, [deals, debouncedSearchTerm, myDealsOnly, user?.id]);

  const [formError, setFormError] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
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
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    if (!quickDeal.title && !quickDeal.company) { setQuickError('ใส่ชื่อดีลหรือบริษัทอย่างน้อย 1 อย่าง'); return; }
    setQuickError(null);
    try {
      // Auto-match customer if existing
      const matched = customers.find(c =>
        (c.company || '').toLowerCase() === quickDeal.company.toLowerCase() ||
        (c.name || '').toLowerCase() === quickDeal.company.toLowerCase()
      );

      await addDealMutation.mutateAsync({
        title: quickDeal.title || quickDeal.company,
        company: quickDeal.company,
        customer_id: matched ? matched.id : null,
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
                        if (shouldBlockBasic) {
                          openPaywall(isGuestAccount ? 'default' : 'trial_ended');
                        } else {
                          setIsQuickAddOpen(true);
                          setQuickError(null);
                        }
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                    >
                      <Zap size={12} className="text-amber-500 fill-amber-500" />
                      <span>Quick Add (บันทึกด่วน)</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        if (shouldBlockBasic) {
                          openPaywall(isGuestAccount ? 'default' : 'trial_ended');
                        } else {
                          setIsScanOpen(true);
                        }
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
            onClick={() => shouldBlockBasic ? openPaywall(isGuestAccount ? 'default' : 'trial_ended') : setIsAddModalOpen(true)}
            className="h-9 px-4 rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20 flex items-center gap-1.5 font-bold"
          >
            <Plus size={13} /> เพิ่มดีลใหม่
          </Button>
        </div>
      </header>

      {/* QUICK ADD DIALOG */}
      <Dialog open={isQuickAddOpen} onOpenChange={(v) => { setIsQuickAddOpen(v); if (!v) { setQuickDeal({ company: '', title: '', value: '', expected_close_date: '' }); setQuickError(null); } }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-0">
          {/* Amber top ribbon */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Zap size={18} className="text-amber-500 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Quick Add Deal</h3>
                <p className="text-xs text-slate-400 mt-0.5">เพิ่มดีลด่วน — กรอกแค่สิ่งสำคัญ</p>
              </div>
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชื่อบริษัท</label>
                <Input
                  placeholder="เช่น บริษัท ABC จำกัด"
                  value={quickDeal.company}
                  onChange={e => setQuickDeal(q => ({ ...q, company: e.target.value }))}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-semibold"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">มูลค่า (บาท)</label>
                <Input
                  type="number"
                  placeholder="500,000"
                  value={quickDeal.value}
                  onChange={e => setQuickDeal(q => ({ ...q, value: e.target.value }))}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-bold text-amber-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">วันคาดว่าจะปิด</label>
                <input
                  type="date"
                  value={quickDeal.expected_close_date}
                  onChange={e => setQuickDeal(q => ({ ...q, expected_close_date: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-amber-400 focus:bg-white transition-all text-sm font-semibold"
                />
              </div>
              {quickError && (
                <p className="text-xs text-rose-500 font-medium bg-rose-50 px-3 py-2 rounded-xl">{quickError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="flex-1 h-11 rounded-xl text-sm text-slate-500 border border-slate-200 hover:bg-slate-50"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={addDealMutation.isPending}
                  className="flex-[2] h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold border-0 shadow-md shadow-amber-500/20 disabled:opacity-60"
                >
                  {addDealMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : '⚡ บันทึกด่วน'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>



      <MonthlyPipeline
        deals={filteredDeals}
        onAddDeal={(data) => {
          if (shouldBlockBasic) {
            openPaywall(isGuestAccount ? 'default' : 'trial_ended');
            return;
          }
          if (data) addDealMutation.mutate(data);
          else setIsAddModalOpen(true);
        }}
        onUpdateDeal={handleUpdateDeal}
        onDeleteDeal={(id) => {
          if (shouldBlockBasic) {
            openPaywall(isGuestAccount ? 'default' : 'trial_ended');
            return;
          }
          deleteDealsMutation.mutate([id]);
        }}
        pendingOpenDeal={pendingOpenDeal}
        onPendingOpenDealHandled={clearPendingOpenDeal}
      />

      {/* ADD ASSET MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl lg:max-w-5xl p-0 border-0 shadow-2xl overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-2xl">
          {/* Top Gradient Ribbon */}
          <div className="h-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600" />
          
          <div className="p-8 overflow-y-auto max-h-[88vh]">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/5">
                <Plus size={22} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  เพิ่มดีลการขายใหม่ 
                  <Sparkles size={16} className="text-amber-400 fill-amber-400/10" />
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">กรอกรายละเอียดดีลการขายและรับคำแนะนำเชิงกลยุทธ์จาก AI ทันที</p>
              </div>
            </div>

            {/* Wizard Steps Header */}
            <div className="flex items-center gap-6 border-b border-slate-100 pb-4 mb-6">
              <button
                type="button"
                onClick={() => setFormTab('details')}
                className={cn(
                  "flex items-center gap-2 pb-2 text-sm font-bold relative transition-all duration-200",
                  formTab === 'details' ? "text-violet-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                  formTab === 'details' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  1
                </div>
                <span>ข้อมูลดีลหลัก</span>
                {formTab === 'details' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormTab('contact')}
                className={cn(
                  "flex items-center gap-2 pb-2 text-sm font-bold relative transition-all duration-200",
                  formTab === 'contact' ? "text-violet-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                  formTab === 'contact' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  2
                </div>
                <span>ผู้ติดต่อ & ผู้รับผิดชอบ</span>
                {formTab === 'contact' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                )}
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left Column: Interactive Form Steps (7 cols) */}
              <div className="xl:col-span-7 flex flex-col justify-between min-h-[420px]">
                <AnimatePresence mode="wait">
                  {formTab === 'details' ? (
                    <motion.div
                      key="details-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-5"
                    >
                      {/* Customer Selector / Linkage */}
                      <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative z-50">
                        {newDeal.customer_id ? (
                          <div className="bg-gradient-to-br from-violet-50/80 to-indigo-50/80 border border-violet-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm shadow-violet-500/5 transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-violet-500/20">
                                {(customers.find(c => c.id === newDeal.customer_id)?.name || 'C').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ลูกค้าที่เชื่อมโยง</p>
                                <p className="text-sm font-extrabold text-slate-900 leading-tight mt-1">
                                  {customers.find(c => c.id === newDeal.customer_id)?.name || 'ไม่พบบัญชีลูกค้า'}
                                </p>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-none">
                                  {customers.find(c => c.id === newDeal.customer_id)?.company || 'ไม่มีข้อมูลบริษัท'}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setCustomerSearch('');
                                setNewDeal(prev => ({
                                  ...prev,
                                  customer_id: '',
                                  company: '',
                                  title: '',
                                  contact: '',
                                  contact_phone: '',
                                  contact_email: '',
                                }));
                              }}
                              className="h-8 px-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-100 hover:border-rose-100 text-xs font-bold border transition-all"
                            >
                              ยกเลิกเชื่อมโยง
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1.5 relative z-50">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              เลือกลูกค้าที่มีในระบบ (เพื่อกรอกข้อมูลอัตโนมัติ)
                            </label>
                            <div className="relative z-20">
                              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Search size={16} />
                              </div>
                              <Input
                                placeholder="พิมพ์ค้นหา หรือคลิกเพื่อเลือก..."
                                value={customerSearch}
                                onChange={(e) => {
                                  setCustomerSearch(e.target.value);
                                  setIsCustomerDropdownOpen(true);
                                }}
                                onClick={() => setIsCustomerDropdownOpen(true)}
                                onFocus={() => setIsCustomerDropdownOpen(true)}
                                className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-10 outline-none focus:border-violet-400 transition-all text-sm font-semibold cursor-pointer"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setIsCustomerDropdownOpen(!isCustomerDropdownOpen);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <ChevronDown size={16} className={cn("transition-transform duration-200", isCustomerDropdownOpen && "rotate-180")} />
                              </button>
                            </div>

                            {isCustomerDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsCustomerDropdownOpen(false)} />
                                <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2 custom-scrollbar">
                                  {filteredCustomers.length === 0 ? (
                                    <div className="px-4 py-6 text-sm text-slate-400 text-center font-medium flex flex-col items-center gap-2">
                                      <span>ไม่มีชื่อลูกค้านี้ในระบบ</span>
                                      <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md">พิมพ์ชื่อต่อไปเพื่อสร้างลูกค้าใหม่</span>
                                    </div>
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
                                            title: prev.title || `ดีลใหม่ - ${c.company || c.name}`,
                                            contact: c.name || '',
                                            contact_phone: c.phone || '',
                                            contact_email: c.email || '',
                                          }));
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-violet-50 text-xs font-semibold text-slate-700 flex flex-col gap-0.5 border-b border-slate-50 last:border-0 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-[10px] font-bold text-violet-700">
                                            {(c.name || 'C').charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                            <span className="text-slate-900 font-bold text-sm block leading-none">{c.name}</span>
                                            {c.company && <span className="text-slate-500 text-xs block mt-1 leading-none">{c.company}</span>}
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Deal Title */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">ชื่อดีล *</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Briefcase size={16} />
                          </span>
                          <Input
                            required
                            placeholder="เช่น โปรเจกต์ติดตั้งระบบ"
                            value={newDeal.title}
                            onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                            className="h-11 pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:bg-white focus:border-violet-400"
                          />
                        </div>
                      </div>

                      {/* Company & Value */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">ชื่อบริษัท / องค์กร *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <Building2 size={16} />
                            </span>
                            <Input
                              required
                              placeholder="เช่น บริษัท ABC จำกัด"
                              value={newDeal.company}
                              onChange={(e) => {
                                const company = e.target.value;
                                const matched = customers.find(c =>
                                  (c.company || '').toLowerCase() === company.toLowerCase() ||
                                  (c.name || '').toLowerCase() === company.toLowerCase()
                                );
                                setNewDeal({
                                  ...newDeal,
                                  company,
                                  customer_id: matched ? matched.id : newDeal.customer_id,
                                });
                              }}
                              className="h-11 pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:bg-white focus:border-violet-400"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">มูลค่าดีล (บาท) *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <DollarSign size={16} className="text-violet-500" />
                            </span>
                            <Input
                              required
                              type="number"
                              placeholder="0"
                              value={newDeal.value}
                              onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                              className="h-11 pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-black focus:bg-white text-violet-700 focus:border-violet-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stage Selector Grid */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">ขั้นตอนปัจจุบัน</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                              <motion.button
                                key={stage.id}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
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
                                  "flex items-center justify-center gap-1.5 min-h-[2.5rem] py-1.5 px-2 h-auto flex-wrap rounded-xl border text-center transition-all duration-200 text-xs font-semibold relative overflow-hidden",
                                  isActive
                                    ? cn("border-2 shadow-sm", stage.activeBg)
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                )}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="activeStageGlow"
                                    className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 opacity-50"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                  />
                                )}
                                <span className={cn("w-2 h-2 rounded-full", stage.color)} />
                                <span>{stage.label}</span>
                                {isActive && <Check size={12} className="text-current ml-0.5 shrink-0" />}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Probability & expected close date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">โอกาสปิด (%)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <Smile size={16} />
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="50"
                              value={newDeal.probability}
                              onChange={(e) => setNewDeal({...newDeal, probability: e.target.value})}
                              className="h-11 pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:bg-white focus:border-violet-400"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">วันคาดว่าจะปิด</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <Calendar size={16} />
                            </span>
                            <input
                              type="date"
                              value={newDeal.expected_close_date}
                              onChange={(e) => setNewDeal({...newDeal, expected_close_date: e.target.value})}
                              className="w-full h-11 pl-10 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 focus:bg-white transition-all text-sm font-bold text-slate-800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Nav Buttons Tab 1 */}
                      <div className="pt-6 flex gap-3 border-t border-slate-100 mt-6">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsAddModalOpen(false)}
                          className="flex-1 h-11 rounded-xl text-sm text-slate-500 font-semibold"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setFormTab('contact')}
                          className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-500/20 flex items-center justify-center gap-2"
                        >
                          ถัดไป <ArrowRight size={16} />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="contact-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-5"
                    >
                      {/* Owner selection */}
                      {teamMembers.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">ผู้รับผิดชอบดีล</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <UserCheck size={16} />
                            </span>
                            <select
                              value={newDeal.assigned_to}
                              onChange={(e) => setNewDeal({ ...newDeal, assigned_to: e.target.value })}
                              className="w-full h-11 pl-10 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-violet-400 focus:bg-white transition-all text-sm font-semibold appearance-none"
                            >
                              <option value="">— ไม่ระบุ —</option>
                              {teamMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}{m.role ? ` (${m.role})` : ''}</option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronDown size={16} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Contacts block */}
                      <div className="space-y-4 pt-2">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-violet-600">ข้อมูลผู้ติดต่อประสานงาน</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">ชื่อผู้ติดต่อ</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <User size={16} />
                              </span>
                              <Input
                                placeholder="ระบุชื่อจริง/ชื่อเล่น"
                                value={newDeal.contact}
                                onChange={(e) => setNewDeal({...newDeal, contact: e.target.value})}
                                className="h-11 pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-violet-400"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">เบอร์โทรศัพท์</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Phone size={16} />
                              </span>
                              <Input
                                placeholder="เช่น 089-XXX-XXXX"
                                value={newDeal.contact_phone}
                                onChange={(e) => setNewDeal({...newDeal, contact_phone: e.target.value})}
                                className="h-11 pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-violet-400"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">อีเมล</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Mail size={16} />
                              </span>
                              <Input
                                type="email"
                                placeholder="เช่น name@company.com"
                                value={newDeal.contact_email}
                                onChange={(e) => setNewDeal({...newDeal, contact_email: e.target.value})}
                                className="h-11 pl-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-violet-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {formError && (
                        <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600">
                          ⚠️ {formError}
                        </div>
                      )}

                      {/* Nav Buttons Tab 2 */}
                      <div className="pt-6 flex gap-3 border-t border-slate-100 mt-6">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setFormTab('details')}
                          className="flex-1 h-11 rounded-xl text-sm text-slate-500 font-semibold flex items-center justify-center gap-2"
                        >
                          <ArrowLeft size={16} /> ย้อนกลับ
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Live Card Preview & AI Guidance (5 cols) */}
              <div className="xl:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-3xl border border-slate-200/60 flex flex-col justify-between space-y-6 max-h-[78vh] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span>👀 Live Card Preview</span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">การ์ดจำลองบนบอร์ด Kanban ของคุณ:</p>
                  </div>

                  {/* Kanban Deal Card Mock */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 pointer-events-none relative overflow-hidden group">
                    {/* Pulsing state light */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 shrink-0">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full ring-4 ring-offset-0 transition-all duration-300",
                        newDeal.stage === 'won' ? 'bg-emerald-500 ring-emerald-100' :
                        newDeal.stage === 'lost' ? 'bg-rose-500 ring-rose-100' :
                        newDeal.stage === 'negotiation' ? 'bg-violet-500 ring-violet-100' :
                        newDeal.stage === 'proposal' ? 'bg-sky-500 ring-sky-100' :
                        newDeal.stage === 'contact' ? 'bg-amber-500 ring-amber-100' : 'bg-slate-400 ring-slate-100'
                      )} />
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/5 border border-slate-200/60 flex items-center justify-center text-slate-700 font-black text-sm uppercase shrink-0">
                        {(newDeal.company || 'C').charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">
                          {newDeal.company || 'ยังไม่ระบุชื่อบริษัท'}
                        </p>
                        <p className="text-sm font-extrabold text-slate-900 truncate mt-1 leading-tight">
                          {newDeal.title || 'กรอกชื่อดีลเพื่อสร้างพรีวิว'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">มูลค่าดีล</p>
                        <span className="text-lg font-black text-slate-900 tabular-nums leading-none block mt-1">
                          {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(newDeal.value) || 0)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">โอกาสปิด</p>
                        <span className="text-sm font-black text-violet-600 block mt-1">
                          {newDeal.probability || '50'}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm shadow-violet-500/10">
                        {newDeal.assigned_to ? (teamMembers.find(t => t.id === newDeal.assigned_to)?.name?.charAt(0).toUpperCase() || 'U') : 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              Number(newDeal.probability) >= 70 ? 'bg-emerald-500' :
                              Number(newDeal.probability) >= 40 ? 'bg-violet-600' : 'bg-slate-350'
                            )}
                            style={{ width: `${Math.max(0, Math.min(100, Number(newDeal.probability) || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Guidance Box */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-5 border border-slate-800/80 shadow-xl space-y-3 mt-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1.5 relative z-10">
                    <Zap size={12} className="text-violet-400 fill-violet-400/20 animate-pulse" />
                    <span>วิเคราะห์กลยุทธ์ด้วย AI ผู้ช่วยขาย</span>
                  </h5>
                  <div className="text-xs leading-relaxed space-y-2 relative z-10">
                    {(() => {
                      const val = Number(newDeal.value) || 0;
                      const stage = newDeal.stage;
                      const expClose = newDeal.expected_close_date;
                      const assignee = newDeal.assigned_to;
                      const tips = [];
                      
                      let priorityChip = null;
                      if (val >= 1000000) {
                        priorityChip = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 tracking-wider uppercase">
                            👑 VIP Deal (มูลค่าสูง)
                          </span>
                        );
                      } else if (val > 0 && val < 50000) {
                        priorityChip = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 tracking-wider uppercase">
                            ⚡ Fast Run (ดีลปิดด่วน)
                          </span>
                        );
                      } else if (val > 0) {
                        priorityChip = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black text-violet-400 tracking-wider uppercase">
                            💼 Standard Deal
                          </span>
                        );
                      }

                      if (val >= 1000000) {
                        tips.push("ดีลมีมูลค่าสูงมาก ควรเฝ้าระวังไม่ให้ขาดกิจกรรมการคุยนานเกิน 7 วัน");
                      } else if (val > 0 && val < 50000) {
                        tips.push("ดีลขนาดเล็ก แนะนำส่งใบเสนอราคาอย่างรวดเร็วเพื่อกระตุ้นให้ปิดใน 3 วัน");
                      }

                      if (stage === 'lead') {
                        tips.push("ขั้นตอน 'ลูกค้าใหม่': แนะนำโทรนัดหมายและสอบถามความต้องการที่แท้จริงด่วนที่สุด");
                      } else if (stage === 'negotiation') {
                        tips.push("ขั้นตอน 'กำลังปิด': ดีลเข้าใกล้เป้าหมายแล้ว เตรียมสัญญาและสรุปราคาสุดท้าย");
                      }

                      if (!expClose) {
                        tips.push("ยังไม่ระบุวันคาดปิด: แนะนำระบุวันเพื่อให้ AI สามารถพยากรณ์รายรับได้แม่นยำ");
                      }

                      if (!assignee) {
                        tips.push("ยังไม่มีผู้ดูแลรับผิดชอบ: ดีลจะถูกจัดอยู่ในดีลกลาง (Unassigned)");
                      }

                      return (
                        <div className="space-y-3">
                          {priorityChip && <div className="flex gap-1.5">{priorityChip}</div>}
                          {tips.length === 0 ? (
                            <p className="text-slate-400 font-medium text-xs leading-snug">กรอกข้อมูลดีลทางด้านซ้ายเพื่อรับการพยากรณ์และกลยุทธ์ปิดการขายจาก AI ทันที</p>
                          ) : (
                            <ul className="space-y-2 text-slate-350 font-medium text-xs leading-snug">
                              {tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* SYNC MODAL */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl bg-white border-0 shadow-2xl">
          {/* Scanner ribbon */}
          <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 shrink-0">
                 <ScanLine size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Quote Scanner</h2>
                <p className="text-sm text-slate-400 mt-0.5">วิเคราะห์และดึงข้อมูลดีลจากไฟล์ PDF อัตโนมัติ</p>
              </div>
            </div>
            
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
