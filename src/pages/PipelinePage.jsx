import { useState, useMemo } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useAddMultipleDeals, useDeleteDeals } from '../hooks/useDeals';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Filter, Search, ListTree, Loader2, Sliders, ScanLine } from 'lucide-react';
import PDFImporter from '../components/pipeline/PDFImporter';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';

import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../components/ui/Dialog';

const STAGES = [
  { id: 'lead', label: 'New Lead' },
  { id: 'contact', label: 'Meeting' },
  { id: 'proposal', label: 'Quotation' },
  { id: 'negotiation', label: 'Closing' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

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
      if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'value') return Number(b.value) - Number(a.value);
      return 0;
    });
    return result;
  }, [deals, searchTerm, stageFilter, sortBy]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addDealMutation.mutate({
        ...newDeal,
        value: Number(newDeal.value) || 0,
        createdAt: new Date().toISOString()
    });
    setIsAddModalOpen(false);
    setNewDeal({ title: '', company: '', value: '', stage: 'lead' });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Matrix Sector...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center bg-rose-50 border border-rose-100 rounded-[2rem] space-y-4 max-w-lg mx-auto mt-20">
      <h3 className="text-xl font-bold text-rose-900 uppercase tracking-tight">Signal Interrupted</h3>
      <p className="text-sm text-rose-600/80 font-medium tracking-tight">We couldn&apos;t synchronize with the matrix stream.</p>
      <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl border-rose-200">Reconnect Index</Button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-[1600px] mx-auto space-y-12 pb-20 px-4 md:px-0"
    >
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl text-primary"><ListTree size={18} /></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Flow Matrix</p>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Sales <span className="text-primary italic">Matrix</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-lg">Advanced longitudinal planning for executive yield capture and resource deployment.</p>
        </div>

        <div className="flex items-center gap-4">
            <Button 
               variant="ghost" 
               onClick={() => setIsScanOpen(true)} 
               className="h-14 px-8 rounded-2xl bg-white border border-slate-100 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50"
            >
               <Sliders size={16} className="mr-2 text-primary" /> Sync Matrix
            </Button>
            <Button variant="ghost" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className={cn("h-14 px-8 rounded-2xl bg-white border border-slate-100 font-black text-[10px] uppercase tracking-widest", isFiltersOpen ? "bg-slate-900 text-white" : "hover:bg-slate-50")}>
               <Filter size={16} className="mr-2" /> Parameters
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 transition-transform">
               <Plus size={16} className="mr-2" /> New Asset
            </Button>
        </div>
      </header>

      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
             <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-wrap gap-8 items-start">
               <div className="space-y-4 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Sector Refinement</p>
                  <div className="flex flex-wrap gap-3">
                    {STAGES.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => setStageFilter(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                        className={cn("px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                          stageFilter.includes(s.id) ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="w-[1px] h-20 bg-slate-100 hidden lg:block" />
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Axis Alignment</p>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-12 bg-slate-50 border-none rounded-2xl px-6 outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer"
                  >
                     <option value="createdAt">Date Created</option>
                     <option value="value">Deal Value</option>
                  </select>
               </div>
               <Button variant="ghost" onClick={() => { setStageFilter([]); setSearchTerm(''); }} className="mt-8 text-[10px] font-black uppercase tracking-widest text-rose-500">Reset Parameters</Button>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
         <div className="flex items-center gap-4 px-2">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <Input 
                 placeholder="Search matrix assets..." 
                 className="h-16 pl-14 bg-white border-slate-200 rounded-[1.5rem] font-bold text-slate-900 focus:ring-primary/20 transition-all placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
         </div>

         <MonthlyPipeline 
            deals={filteredDeals} 
            onAddDeal={(data) => {
                if (data) addDealMutation.mutate(data);
                else setIsAddModalOpen(true);
            }}
            onUpdateDeal={(id, updates) => updateDealMutation.mutate({ id, ...updates })}
            onDeleteDeal={(id) => deleteDealsMutation.mutate([id])}
         />
      </div>

      {/* ADD ASSET MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[3rem] p-12 border-0 shadow-2xl">
          <DialogHeader className="mb-8">
             <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Initialize New Asset</DialogTitle>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Specify operational variables for the sales matrix</p>
          </DialogHeader>
          
          <form onSubmit={handleAddSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                <Input 
                   required
                   placeholder="e.g. Infrastructure Upgrade"
                   value={newDeal.title}
                   onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                   className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Enterprise</label>
                <Input 
                   required
                   placeholder="e.g. Acme Corp"
                   value={newDeal.company}
                   onChange={(e) => setNewDeal({...newDeal, company: e.target.value})}
                   className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                />
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yield Value (THB)</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrix Sector</label>
                    <select 
                       value={newDeal.stage}
                       onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})}
                       className="w-full h-14 rounded-2xl border-0 ring-1 ring-slate-100 bg-slate-50/50 px-4 font-bold outline-none focus:ring-primary transition-all"
                    >
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
             </div>

             <div className="pt-6 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                <Button type="submit" className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all">Deploy Asset</Button>
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
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
