import { useState } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useDeleteDeals } from '../hooks/useDeals';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Zap, Layers } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function PipelinePage() {
  const { data: deals, isLoading, error } = useDeals();
  const updateDealMutation = useUpdateDeal();
  const addDealMutation = useAddDeal();
  const deleteDealsMutation = useDeleteDeals();

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={32} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Initializing Neural Pipeline...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center bg-red-500/10 border border-red-500/20 rounded-[3rem] space-y-4">
      <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-500">
        <Layers size={32} />
      </div>
      <h3 className="text-xl font-black uppercase tracking-tighter italic">Pipeline Rupture</h3>
      <p className="text-sm text-red-400/80 max-w-xs mx-auto">Neural connection to the signal matrix was lost. Please re-establish link.</p>
      <Button onClick={() => window.location.reload()} variant="outline" className="border-red-500/20 text-red-400">Re-Link Matrix</Button>
    </div>
  );

  const handleUpdateDeal = async (id, updates) => {
    try {
      await updateDealMutation.mutateAsync({ id, ...updates });
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDeleteDeal = async (id) => {
    try {
      await deleteDealsMutation.mutateAsync([id]);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddDeal = async (e) => {
    e?.preventDefault();
    const formData = e ? new FormData(e.target) : null;
    
    const newDeal = {
      title: formData ? formData.get('title') : selectedDeal?.title,
      company: formData ? formData.get('company') : selectedDeal?.company,
      value: formData ? Number(formData.get('value')) : (selectedDeal?.value || 0),
      stage: 'lead',
      assigned_to: 'leader',
      createdAt: new Date().toISOString(),
      probability: selectedDeal?.probability || 20,
    };

    try {
      await addDealMutation.mutateAsync(newDeal);
      setIsAddModalOpen(false);
      setSelectedDeal(null);
    } catch (err) {
      console.error('Add failed', err);
    }
  };

  const openAddModal = (prefillData = null) => {
    if (prefillData) {
      setSelectedDeal(prefillData);
    } else {
      setSelectedDeal(null);
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col space-y-10 animate-fade-up">
      {/* TACTICAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Tactical Matrix</h1>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-5 opacity-60">Global Stream Orchestration • {deals?.length || 0} ACTIVE SIGNALS</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden lg:flex items-center gap-6 px-8 py-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-center">
                 <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Matrix Volume</p>
                 <p className="text-lg font-black tabular-nums">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(deals?.reduce((s,d) => s+(d.value||0), 0) || 0)}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                 <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Signal Health</p>
                 <p className="text-lg font-black text-emerald-500 tabular-nums">98.4%</p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <MonthlyPipeline
          deals={deals || []}
          onDealClick={(deal) => {
            setSelectedDeal(deal);
          }}
          onUpdateDeal={handleUpdateDeal}
          onDeleteDeal={handleDeleteDeal}
          onAddDeal={openAddModal}
        />
      </div>

      {/* DEPLOYMENT DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div className="p-10">
          <DialogHeader className="mb-10 border-b border-white/5 pb-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Plus size={28} />
               </div>
               <div>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">Deploy New Node</DialogTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2">Initialize signal in the global matrix</p>
               </div>
            </div>
          </DialogHeader>
          <form className="space-y-8" onSubmit={handleAddDeal}>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Opportunity Signal</label>
              <Input name="title" defaultValue={selectedDeal?.title} placeholder="e.g. Enterprise Cloud expansion" className="h-14 bg-white/5 border-white/10 rounded-2xl font-bold text-base focus:ring-primary/50 transition-all" required />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Entity Reference</label>
              <Input name="company" defaultValue={selectedDeal?.company} placeholder="e.g. Nexus Corp" className="h-14 bg-white/5 border-white/10 rounded-2xl font-bold text-base focus:ring-primary/50 transition-all" required />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Value Projection (THB)</label>
              <Input name="value" type="number" defaultValue={selectedDeal?.value} placeholder="500000" className="h-14 bg-white/5 border-white/10 rounded-2xl font-black text-lg tabular-nums focus:ring-primary/50 transition-all" required />
            </div>
            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-widest border-white/10 hover:bg-white/5 transition-all">Abort</Button>
              <Button type="submit" className="h-14 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Initialize Deployment</Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
