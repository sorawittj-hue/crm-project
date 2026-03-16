import { useState, useMemo } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useDeleteDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Filter, Search, SortAsc, DollarSign, X } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';

const STAGES = [
  { id: 'lead', label: 'New Lead', color: 'bg-slate-500' },
  { id: 'contact', label: 'Meeting', color: 'bg-amber-500' },
  { id: 'proposal', label: 'Quotation', color: 'bg-emerald-500' },
  { id: 'negotiation', label: 'Closing', color: 'bg-blue-500' },
  { id: 'won', label: 'Won', color: 'bg-emerald-600' },
  { id: 'lost', label: 'Lost', color: 'bg-rose-500' },
];

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

export default function PipelinePage() {
  const { data: deals, isLoading, error } = useDeals();
  const { data: teamMembers } = useTeam();
  const updateDealMutation = useUpdateDeal();
  const addDealMutation = useAddDeal();
  const deleteDealsMutation = useDeleteDeals();

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState([]);
  const [assigneeFilter, setAssigneeFilter] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

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
    if (assigneeFilter.length > 0) result = result.filter(d => assigneeFilter.includes(d.assigned_to));

    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') comparison = new Date(b.createdAt) - new Date(a.createdAt);
      else if (sortBy === 'value') comparison = Number(b.value) - Number(a.value);
      else if (sortBy === 'probability') comparison = (b.probability || 0) - (a.probability || 0);
      else if (sortBy === 'company') comparison = (a.company || '').localeCompare(b.company || '');
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [deals, searchTerm, stageFilter, assigneeFilter, sortBy, sortOrder]);

  const toggleStageFilter = (id) => {
    setStageFilter(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleAssigneeFilter = (id) => {
    setAssigneeFilter(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setStageFilter([]);
    setAssigneeFilter([]);
  };

  const pipelineStats = useMemo(() => {
    const activeDeals = filteredDeals.filter(d => !['won', 'lost'].includes(d.stage));
    const totalValue = activeDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const weightedValue = activeDeals.reduce((sum, d) => sum + (Number(d.value || 0) * ((d.probability || 0) / 100)), 0);
    const avgDealSize = activeDeals.length > 0 ? totalValue / activeDeals.length : 0;
    const avgProbability = activeDeals.length > 0 ? activeDeals.reduce((sum, d) => sum + (d.probability || 0), 0) / activeDeals.length : 0;

    return {
      total: filteredDeals.length,
      active: activeDeals.length,
      won: filteredDeals.filter(d => d.stage === 'won').length,
      lost: filteredDeals.filter(d => d.stage === 'lost').length,
      totalValue,
      weightedValue,
      avgDealSize,
      avgProbability
    };
  }, [filteredDeals]);

  const handleUpdateDeal = async (id, updates) => {
    try { await updateDealMutation.mutateAsync({ id, ...updates }); } catch (err) { console.error('Update failed', err); }
  };

  const handleDeleteDeal = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try { await deleteDealsMutation.mutateAsync([id]); } catch (err) { console.error('Delete failed', err); }
    }
  };

  const handleAddDeal = async (e) => {
    e?.preventDefault();
    const formData = e ? new FormData(e.target) : null;
    const newDeal = {
      title: formData ? formData.get('title') : selectedDeal?.title,
      company: formData ? formData.get('company') : selectedDeal?.company,
      value: formData ? Number(formData.get('value')) : (selectedDeal?.value || 0),
      probability: formData ? Number(formData.get('probability')) : (selectedDeal?.probability || 20),
      stage: 'lead',
      assigned_to: formData ? formData.get('assigned_to') : (selectedDeal?.assigned_to || 'leader'),
      contact: formData ? formData.get('contact') : '',
      source: formData ? formData.get('source') : 'inbound',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    try {
      await addDealMutation.mutateAsync(newDeal);
      setIsAddModalOpen(false);
      setSelectedDeal(null);
    } catch (err) { console.error('Add failed', err); }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
      />
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Pipeline...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center bg-rose-50 border border-rose-100 rounded-[2rem] space-y-4 max-w-lg mx-auto mt-20">
      <h3 className="text-xl font-bold text-rose-900">Connection Interrupted</h3>
      <p className="text-sm text-rose-600/80">We couldn&apos;t load your pipeline data. Please try again.</p>
      <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">Retry Connection</Button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Deal Pipeline</h1>
          <p className="text-muted-foreground font-medium">Manage and track your active sales opportunities.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="h-12 px-8 rounded-full shadow-lg shadow-primary/20">
          <Plus size={18} className="mr-2" /> New Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Projects', value: pipelineStats.total },
          { label: 'Active', value: pipelineStats.active, highlight: true },
          { label: 'Won', value: pipelineStats.won, color: 'text-emerald-600' },
          { label: 'Portfolio Value', value: formatCurrency(pipelineStats.totalValue), wide: true },
          { label: 'Weighted Value', value: formatCurrency(pipelineStats.weightedValue), accent: true },
          { label: 'Avg. Confidence', value: `${Math.round(pipelineStats.avgProbability)}%` },
        ].map((stat, i) => (
          <Card key={i} className={cn("p-4 border-slate-200/60 shadow-sm", stat.wide && "lg:col-span-1")}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
            <p className={cn("text-xl font-black", stat.highlight ? "text-primary" : stat.color || "text-slate-900")}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 border-slate-200/60 shadow-sm overflow-visible">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by company or project..."
              className="pl-12 h-12 bg-slate-50 border-transparent rounded-full font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={cn("h-12 px-6 rounded-full font-bold gap-2", (stageFilter.length > 0 || assigneeFilter.length > 0) && "border-primary text-primary bg-primary/5")}
            >
              <Filter size={18} /> Filters
              {(stageFilter.length > 0 || assigneeFilter.length > 0) && (
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                  {stageFilter.length + assigneeFilter.length}
                </div>
              )}
            </Button>
            <div className="flex items-center gap-2 bg-slate-50 border border-transparent rounded-full px-4 h-12">
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="hover:text-primary transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <SortAsc size={16} className={cn(sortOrder === 'asc' ? "text-primary" : "text-muted-foreground")} />
              </button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest outline-none">
                <option value="createdAt">Date Created</option>
                <option value="value">Deal Value</option>
                <option value="probability">Confidence</option>
                <option value="company">Client Name</option>
              </select>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 pt-6 border-t border-slate-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4">Stages</p>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map(stage => (
                      <button
                        key={stage.id}
                        onClick={() => toggleStageFilter(stage.id)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                          stageFilter.includes(stage.id) ? "bg-slate-900 text-white border-transparent" : "bg-white text-muted-foreground border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4">Assigned To</p>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers?.map(member => (
                      <button
                        key={member.id}
                        onClick={() => toggleAssigneeFilter(member.id)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-2",
                          assigneeFilter.includes(member.id) ? "bg-primary text-white border-transparent" : "bg-white text-muted-foreground border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {(stageFilter.length > 0 || assigneeFilter.length > 0) && (
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                   <div className="flex flex-wrap gap-2">
                      {stageFilter.map(s => (
                        <Badge key={s} variant="secondary" className="rounded-full bg-white border-slate-200">
                          {STAGES.find(st => st.id === s)?.label}
                          <button onClick={() => toggleStageFilter(s)} className="ml-1.5 hover:text-rose-500"><X size={10} /></button>
                        </Badge>
                      ))}
                      {assigneeFilter.map(m => (
                        <Badge key={m} variant="secondary" className="rounded-full bg-white border-slate-200">
                          {teamMembers?.find(tm => tm.id === m)?.name}
                          <button onClick={() => toggleAssigneeFilter(m)} className="ml-1.5 hover:text-rose-500"><X size={10} /></button>
                        </Badge>
                      ))}
                   </div>
                   <button onClick={clearFilters} className="text-[10px] font-bold uppercase text-rose-500 hover:underline">Clear all</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="flex-1 min-h-[600px]">
        <MonthlyPipeline
          deals={filteredDeals}
          onDealClick={(deal) => setSelectedDeal(deal)}
          onUpdateDeal={handleUpdateDeal}
          onDeleteDeal={handleDeleteDeal}
          onAddDeal={() => setIsAddModalOpen(true)}
        />
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Register New Opportunity</DialogTitle>
            <p className="text-xs text-muted-foreground">Add a new deal to your current pipeline.</p>
          </DialogHeader>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleAddDeal}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Project Title</label>
              <Input name="title" placeholder="e.g. Q3 Server Expansion" className="rounded-2xl bg-slate-50 border-none h-12" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Client / Company</label>
              <Input name="company" placeholder="e.g. TechnoSoft Ltd." className="rounded-2xl bg-slate-50 border-none h-12" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Deal Value (THB)</label>
              <div className="relative">
                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <Input name="value" type="number" placeholder="0" className="rounded-2xl bg-slate-50 border-none h-12 pl-10 font-bold" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confidence (%)</label>
              <Input name="probability" type="number" min="0" max="100" defaultValue="20" className="rounded-2xl bg-slate-50 border-none h-12 font-bold" />
            </div>
            <div className="flex justify-end gap-3 pt-6 md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-6">Cancel</Button>
              <Button type="submit" className="rounded-full px-8">Save Deal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
