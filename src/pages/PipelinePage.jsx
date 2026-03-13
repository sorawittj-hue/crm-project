import { useState, useMemo } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useDeleteDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Zap, Layers, Filter, Search, SortAsc, Calendar, DollarSign, TrendingUp, Users, X } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-blue-500' },
  { id: 'contact', label: 'Contact', color: 'bg-indigo-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'won', label: 'Won', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' },
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

  // Filtered and sorted deals
  const filteredDeals = useMemo(() => {
    let result = deals || [];

    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.title?.toLowerCase().includes(s) || 
        d.company?.toLowerCase().includes(s) ||
        d.contact?.toLowerCase().includes(s)
      );
    }

    // Stage filter
    if (stageFilter.length > 0) {
      result = result.filter(d => stageFilter.includes(d.stage));
    }

    // Assignee filter
    if (assigneeFilter.length > 0) {
      result = result.filter(d => assigneeFilter.includes(d.assigned_to));
    }

    // Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') {
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'value') {
        comparison = Number(b.value) - Number(a.value);
      } else if (sortBy === 'probability') {
        comparison = (b.probability || 0) - (a.probability || 0);
      } else if (sortBy === 'company') {
        comparison = (a.company || '').localeCompare(b.company || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [deals, searchTerm, stageFilter, assigneeFilter, sortBy, sortOrder]);

  // Pipeline stats
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
    try {
      await updateDealMutation.mutateAsync({ id, ...updates });
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDeleteDeal = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await deleteDealsMutation.mutateAsync([id]);
      } catch (err) {
        console.error('Delete failed', err);
      }
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
    } catch (err) {
      console.error('Add failed', err);
    }
  };

  const toggleStageFilter = (stageId) => {
    setStageFilter(prev => 
      prev.includes(stageId) ? prev.filter(s => s !== stageId) : [...prev, stageId]
    );
  };

  const toggleAssigneeFilter = (memberId) => {
    setAssigneeFilter(prev => 
      prev.includes(memberId) ? prev.filter(m => m !== memberId) : [...prev, memberId]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStageFilter([]);
    setAssigneeFilter([]);
  };

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

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-up">
      {/* ADVANCED HEADER */}
      <div className="space-y-4">
        {/* Top Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total</p>
            <p className="text-xl font-black">{pipelineStats.total}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Active</p>
            <p className="text-xl font-black text-primary">{pipelineStats.active}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Won</p>
            <p className="text-xl font-black text-emerald-500">{pipelineStats.won}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Lost</p>
            <p className="text-xl font-black text-red-500">{pipelineStats.lost}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total Value</p>
            <p className="text-sm font-black">{formatCurrency(pipelineStats.totalValue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Weighted</p>
            <p className="text-sm font-black text-emerald-500">{formatCurrency(pipelineStats.weightedValue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Avg Deal</p>
            <p className="text-sm font-black">{formatCurrency(pipelineStats.avgDealSize)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Avg Prob</p>
            <p className="text-lg font-black text-amber-500">{Math.round(pipelineStats.avgProbability)}%</p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search deals..."
              className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl text-sm font-bold focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              "h-11 border-white/10 bg-white/5 rounded-xl px-4 font-black uppercase text-[9px] tracking-widest",
              (stageFilter.length > 0 || assigneeFilter.length > 0) && "bg-primary/20 border-primary/30 text-primary"
            )}
          >
            <Filter size={16} className="mr-2" />
            Filters
            {(stageFilter.length > 0 || assigneeFilter.length > 0) && (
              <Badge className="ml-2 bg-primary text-primary-foreground">{stageFilter.length + assigneeFilter.length}</Badge>
            )}
          </Button>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest outline-none px-3 py-1"
            >
              <option value="createdAt">Date</option>
              <option value="value">Value</option>
              <option value="probability">Probability</option>
              <option value="company">Company</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <SortAsc size={14} className={cn(sortOrder === 'asc' && "rotate-180 transition-transform")} />
            </button>
          </div>

          {/* Add Deal */}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="h-11 bg-primary text-primary-foreground rounded-xl px-6 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus size={16} className="mr-2" />
            New Deal
          </Button>
        </div>

        {/* Active Filters Display */}
        {(stageFilter.length > 0 || assigneeFilter.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Active:</span>
            {stageFilter.map(stage => (
              <Badge
                key={stage}
                className="cursor-pointer bg-primary/20 text-primary border-primary/30"
                onClick={() => toggleStageFilter(stage)}
              >
                {STAGES.find(s => s.id === stage)?.label}
                <X size={12} className="ml-1" />
              </Badge>
            ))}
            {assigneeFilter.map(memberId => {
              const member = teamMembers?.find(m => m.id === memberId);
              return (
                <Badge
                  key={memberId}
                  className="cursor-pointer bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  onClick={() => toggleAssigneeFilter(memberId)}
                >
                  {member?.name || memberId}
                  <X size={12} className="ml-1" />
                </Badge>
              );
            })}
            <button onClick={clearFilters} className="text-[9px] font-black uppercase text-muted-foreground hover:text-white underline">
              Clear All
            </button>
          </div>
        )}

        {/* Filters Panel */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4 overflow-hidden"
            >
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-2">Filter by Stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => toggleStageFilter(stage.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                        stageFilter.includes(stage.id)
                          ? `${stage.color} text-white border-transparent`
                          : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                      )}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-2">Filter by Team Member</p>
                <div className="flex flex-wrap gap-2">
                  {teamMembers?.map(member => (
                    <button
                      key={member.id}
                      onClick={() => toggleAssigneeFilter(member.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                        assigneeFilter.includes(member.id)
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center text-[8px] text-white", member.color?.split(' ')[0])}>
                        {(member.name || 'U').slice(0, 1)}
                      </div>
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PIPELINE BOARD */}
      <div className="flex-1 min-h-0">
        <MonthlyPipeline
          deals={filteredDeals}
          onDealClick={(deal) => setSelectedDeal(deal)}
          onUpdateDeal={handleUpdateDeal}
          onDeleteDeal={handleDeleteDeal}
          onAddDeal={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* ADD/EDIT DEAL DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-black/95 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-3xl">
          <DialogHeader className="mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Plus size={24} />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none">Deploy New Opportunity</DialogTitle>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2">Initialize deal in the pipeline matrix</p>
               </div>
            </div>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleAddDeal}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Opportunity Title *</label>
                <Input name="title" defaultValue={selectedDeal?.title} placeholder="e.g. Enterprise License Deal" className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-sm focus:ring-primary/50 transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Company *</label>
                <Input name="company" defaultValue={selectedDeal?.company} placeholder="e.g. Acme Corp" className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-sm focus:ring-primary/50 transition-all" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Deal Value (THB) *</label>
                <Input name="value" type="number" defaultValue={selectedDeal?.value} placeholder="500000" className="h-12 bg-white/5 border-white/10 rounded-xl font-black text-base tabular-nums focus:ring-primary/50 transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Win Probability (%)</label>
                <Input name="probability" type="number" min="0" max="100" defaultValue={selectedDeal?.probability || 20} placeholder="20" className="h-12 bg-white/5 border-white/10 rounded-xl font-black text-base tabular-nums focus:ring-primary/50 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Primary Contact</label>
              <Input name="contact" defaultValue={selectedDeal?.contact} placeholder="Contact name" className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-sm focus:ring-primary/50 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Assigned To</label>
                <select name="assigned_to" defaultValue={selectedDeal?.assigned_to || 'leader'} className="h-12 w-full bg-white/5 border-white/10 rounded-xl font-bold text-sm px-4 focus:ring-primary/50 transition-all">
                  {teamMembers?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Source</label>
                <select name="source" defaultValue={selectedDeal?.source || 'inbound'} className="h-12 w-full bg-white/5 border-white/10 rounded-xl font-bold text-sm px-4 focus:ring-primary/50 transition-all">
                  <option value="inbound">Inbound Lead</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="marketing">Marketing</option>
                  <option value="website">Website</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-white/10 hover:bg-white/5 transition-all">Cancel</Button>
              <Button type="submit" className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Deploy Deal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
