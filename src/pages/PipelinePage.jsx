import { useState, useMemo, lazy, Suspense } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useAddMultipleDeals, useDeleteDeals } from '../hooks/useDeals';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Filter, Search, Loader2, Sliders, ScanLine } from 'lucide-react';

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
  const updateDealMutation = useUpdateDeal();
  const addDealMutation = useAddDeal();
  const addMultipleDealsMutation = useAddMultipleDeals();
  const deleteDealsMutation = useDeleteDeals();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');

  const [newDeal, setNewDeal] = useState({ title: '', company: '', value: '', stage: 'lead' });

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

    result = [...result].sort((a, b) => {
      if (sortBy === 'createdAt') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'value') return Number(b.value) - Number(a.value);
      return 0;
    });
    return result;
  }, [deals, searchTerm, stageFilter, sortBy]);

  const [formError, setFormError] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (addDealMutation.isPending) return;
    setFormError(null);
    try {
      await addDealMutation.mutateAsync({
        ...newDeal,
        value: Number(newDeal.value) || 0,
      });
      setIsAddModalOpen(false);
      setNewDeal({ title: '', company: '', value: '', stage: 'lead' });
    } catch (err) {
      setFormError(err?.message || 'ไม่สามารถบันทึกดีลได้ กรุณาลองใหม่');
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

  const activeFilterCount = stageFilter.length + (searchTerm ? 1 : 0);

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
          <Button
            variant="ghost"
            onClick={() => setIsScanOpen(true)}
            className="h-10 px-4 rounded-xl text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <Sliders size={14} className="mr-2" /> สแกน PDF
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20"
          >
            <Plus size={14} className="mr-2" /> เพิ่มดีลใหม่
          </Button>
        </div>
      </header>

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
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-wrap gap-5 items-center">
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs font-semibold text-slate-500 mb-3">กรองตามขั้นตอน</p>
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

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStageFilter([]);
                    setSearchTerm('');
                  }}
                  className="h-9 px-4 text-sm text-rose-500 hover:bg-rose-50 rounded-xl"
                >
                  ล้างตัวกรอง
                </Button>
              )}
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
      />

      {/* ADD ASSET MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[3rem] p-12 border-0 shadow-2xl">
          <DialogHeader className="mb-8">
             <DialogTitle className="text-xl font-bold text-slate-900">เพิ่มดีลใหม่</DialogTitle>
             <p className="text-sm text-slate-400 mt-1">กรอกรายละเอียดดีลที่ต้องการเพิ่ม</p>
          </DialogHeader>
          
          <form onSubmit={handleAddSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">ชื่อดีล</label>
                <Input
                   required
                   placeholder="เช่น โปรเจกต์ติดตั้งระบบ"
                   value={newDeal.title}
                   onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                   className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">บริษัท</label>
                <Input
                   required
                   placeholder="เช่น บริษัท ABC จำกัด"
                   value={newDeal.company}
                   onChange={(e) => setNewDeal({...newDeal, company: e.target.value})}
                   className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                />
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">มูลค่า (บาท)</label>
                    <Input 
                       required
                       type="number"
                       placeholder="0"
                       value={newDeal.value}
                       onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                       className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">ขั้นตอน</label>
                    <select 
                       value={newDeal.stage}
                       onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})}
                       className="w-full h-14 rounded-2xl border-0 ring-1 ring-slate-100 bg-slate-50/50 px-4 font-bold outline-none focus:ring-primary transition-all"
                    >
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
             </div>

             {formError && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
                  {formError}
                </div>
             )}

             <div className="pt-6 flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={addDealMutation.isPending}
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-11 rounded-xl text-sm text-slate-500"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={addDealMutation.isPending}
                  className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
