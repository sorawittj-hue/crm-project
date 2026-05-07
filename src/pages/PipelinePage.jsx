import { useState, useMemo, lazy, Suspense } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useAddMultipleDeals, useDeleteDeals } from '../hooks/useDeals';
import { useCustomers } from '../hooks/useCustomers';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Filter, Search, Loader2, Sliders, ScanLine, Download, User, Zap, X } from 'lucide-react';

// Lazy-load PDFImporter to avoid bundling pdfjs-dist (~5MB) in initial load
const PDFImporter = lazy(() => import('../components/pipeline/PDFImporter'));
import { STAGES } from '../lib/constants';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';

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

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [myDealsOnly, setMyDealsOnly] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickDeal, setQuickDeal] = useState({ company: '', title: '', value: '', expected_close_date: '' });
  const [quickError, setQuickError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [probMin, setProbMin] = useState('');

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

  // We filter the input to MonthlyPipeline based on search and parameters
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
    if (stageFilter.length > 0) result = result.filter(d => stageFilter.includes(d.stage));
    if (valueMin !== '') result = result.filter(d => Number(d.value) >= Number(valueMin));
    if (valueMax !== '') result = result.filter(d => Number(d.value) <= Number(valueMax));
    if (probMin !== '') result = result.filter(d => Number(d.probability) >= Number(probMin));
    if (myDealsOnly && user?.id) result = result.filter(d => d.assigned_to === user.id);

    result = [...result].sort((a, b) => {
      if (sortBy === 'createdAt') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'value') return Number(b.value) - Number(a.value);
      if (sortBy === 'probability') return Number(b.probability) - Number(a.probability);
      if (sortBy === 'stale') {
        const aDay = a.last_activity || a.created_at || 0;
        const bDay = b.last_activity || b.created_at || 0;
        return new Date(aDay) - new Date(bDay);
      }
      return 0;
    });
    return result;
  }, [deals, searchTerm, stageFilter, sortBy, valueMin, valueMax, probMin]);

  const [formError, setFormError] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (addDealMutation.isPending) return;
    setFormError(null);
    try {
      await addDealMutation.mutateAsync({
        ...newDeal,
        value: Number(newDeal.value) || 0,
        probability: Number(newDeal.probability) || 50,
        expected_close_date: newDeal.expected_close_date || null,
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

  const activeFilterCount = stageFilter.length + (searchTerm ? 1 : 0) + (valueMin ? 1 : 0) + (valueMax ? 1 : 0) + (probMin ? 1 : 0) + (myDealsOnly ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-0"
    >
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ดีลทั้งหมด</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการและติดตามดีลในทุกขั้นตอน</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMyDealsOnly(v => !v)}
            className={cn(
              'h-10 px-4 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2',
              myDealsOnly
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            <User size={14} /> ดีลของฉัน
          </button>
          <button
            onClick={exportToCSV}
            className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export CSV
          </button>
          <Button
            variant="ghost"
            onClick={() => setIsScanOpen(true)}
            className="h-10 px-4 rounded-xl text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <Sliders size={14} className="mr-2" /> สแกน PDF
          </Button>
          <Button
            onClick={() => { setIsQuickAddOpen(v => !v); setQuickError(null); }}
            className={cn(
              'h-10 px-4 rounded-xl text-sm border-0 shadow-md flex items-center gap-2 transition-all',
              isQuickAddOpen
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-400/20'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-400/20'
            )}
          >
            <Zap size={14} /> Quick Add
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20"
          >
            <Plus size={14} className="mr-2" /> เพิ่มดีลใหม่
          </Button>
        </div>
      </header>

      {/* QUICK ADD PANEL */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleQuickAdd}
              className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex flex-col md:flex-row items-start md:items-end gap-3"
            >
              <div className="flex items-center gap-2 shrink-0 self-start md:self-auto md:pb-0.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Zap size={13} className="text-white" />
                </div>
                <span className="text-sm font-bold text-amber-700">Quick Add</span>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">ชื่อบริษัท</label>
                  <Input
                    placeholder="เช่น บริษัท ABC"
                    value={quickDeal.company}
                    onChange={e => setQuickDeal(q => ({ ...q, company: e.target.value }))}
                    className="h-9 rounded-xl text-sm border-amber-200 bg-white focus:ring-amber-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">ชื่อดีล</label>
                  <Input
                    placeholder="เช่น Server 2026"
                    value={quickDeal.title}
                    onChange={e => setQuickDeal(q => ({ ...q, title: e.target.value }))}
                    className="h-9 rounded-xl text-sm border-amber-200 bg-white focus:ring-amber-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">ราคา (บาท)</label>
                  <Input
                    type="number"
                    placeholder="500,000"
                    value={quickDeal.value}
                    onChange={e => setQuickDeal(q => ({ ...q, value: e.target.value }))}
                    className="h-9 rounded-xl text-sm border-amber-200 bg-white focus:ring-amber-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">วันที่คาดปิด</label>
                  <Input
                    type="date"
                    value={quickDeal.expected_close_date}
                    onChange={e => setQuickDeal(q => ({ ...q, expected_close_date: e.target.value }))}
                    className="h-9 rounded-xl text-sm border-amber-200 bg-white focus:ring-amber-400/30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {quickError && <span className="text-xs text-rose-600 font-medium">{quickError}</span>}
                <Button
                  type="submit"
                  disabled={addDealMutation.isPending}
                  className="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold border-0 shadow-sm"
                >
                  {addDealMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : 'บันทึก'}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="p-2 rounded-xl text-amber-500 hover:bg-amber-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOOLBAR: search + filter toggle + sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="ค้นหาดีล, บริษัท, ผู้ติดต่อ..."
            className="h-10 pl-11 bg-white border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-violet-500/20 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium outline-none cursor-pointer hover:border-slate-300"
          >
            <option value="createdAt">เรียง: วันที่สร้าง</option>
            <option value="value">เรียง: มูลค่า</option>
            <option value="probability">เรียง: โอกาสสูงสุด</option>
            <option value="stale">เรียง: นิ่งนานที่สุด</option>
          </select>

          <Button
            variant="ghost"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              'h-10 px-4 rounded-xl text-sm border relative',
              isFiltersOpen || activeFilterCount > 0
                ? 'border-violet-300 text-violet-700 bg-violet-50'
                : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
            )}
          >
            <Filter size={14} className="mr-2" /> กรอง
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* COLLAPSIBLE FILTER PANEL */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-5">
              <div className="flex flex-wrap gap-5 items-start">
                {/* Stage filter */}
                <div className="flex-1 min-w-[240px]">
                  <p className="text-xs font-semibold text-slate-500 mb-3">ขั้นตอน</p>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map((s) => {
                      const active = stageFilter.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() =>
                            setStageFilter((prev) =>
                              prev.includes(s.id)
                                ? prev.filter((x) => x !== s.id)
                                : [...prev, s.id]
                            )
                          }
                          className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                            active
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Probability filter */}
                <div className="min-w-[180px]">
                  <p className="text-xs font-semibold text-slate-500 mb-3">โอกาสปิดขั้นต่ำ</p>
                  <div className="flex flex-wrap gap-2">
                    {[['', 'ทั้งหมด'], ['50', '≥ 50%'], ['70', '≥ 70%'], ['90', '≥ 90%']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setProbMin(val)}
                        className={cn(
                          'px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                          probMin === val
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Value range */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">มูลค่าขั้นต่ำ (บาท)</p>
                  <Input
                    type="number"
                    placeholder="เช่น 100000"
                    value={valueMin}
                    onChange={(e) => setValueMin(e.target.value)}
                    className="h-9 w-40 rounded-xl border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">มูลค่าสูงสุด (บาท)</p>
                  <Input
                    type="number"
                    placeholder="เช่น 1000000"
                    value={valueMax}
                    onChange={(e) => setValueMax(e.target.value)}
                    className="h-9 w-40 rounded-xl border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs text-slate-400 font-medium">
                    พบ <span className="text-slate-700 font-bold">{filteredDeals.length}</span> ดีล
                  </span>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStageFilter([]);
                        setSearchTerm('');
                        setValueMin('');
                        setValueMax('');
                        setProbMin('');
                      }}
                      className="h-9 px-4 text-sm text-rose-500 hover:bg-rose-50 rounded-xl"
                    >
                      ล้างตัวกรอง
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
