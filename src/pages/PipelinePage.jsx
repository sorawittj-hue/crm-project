import { useState, useMemo } from 'react';
import { useDeals, useUpdateDeal, useAddDeal, useDeleteDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import MonthlyPipeline from '../components/pipeline/MonthlyPipeline';
import { Plus, Zap, Layers, Filter, Search, SortAsc, DollarSign, TrendingUp, X, Crosshair, ShieldCheck } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';

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
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.2, 1], borderRadius: ["20%", "50%", "20%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 bg-primary/20 flex items-center justify-center border-2 border-primary/50"
      >
        <Zap className="text-primary" size={32} />
      </motion.div>
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Neural Pipeline...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center bg-destructive/10 border border-destructive/20 rounded-[3rem] space-y-4 max-w-lg mx-auto mt-20">
      <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto text-destructive">
        <Layers size={32} />
      </div>
      <h3 className="text-xl font-black uppercase tracking-tighter italic">Pipeline Rupture</h3>
      <p className="text-sm text-destructive/80 font-medium">Neural connection to the signal matrix was lost. Please re-establish link.</p>
      <Button onClick={() => window.location.reload()} variant="outline" className="btn-zenith-outline border-destructive/20 text-destructive">Re-Link Matrix</Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider text-primary leading-none">Authorization: Verified</span>
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">Pipeline Matrix</h1>
          <p className="text-muted-foreground font-medium">Monitor and manage high-value asset transitions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAddModalOpen(true)} className="btn-zenith-primary">
            <Plus size={18} className="mr-2" /> Deploy New Deal
          </Button>
        </div>
      </div>

      {/* Advanced KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="premium-card p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Assets</p>
          <p className="text-2xl font-black">{pipelineStats.total}</p>
        </Card>
        <Card className="premium-card p-3 border-primary/30 bg-primary/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Active</p>
          <p className="text-2xl font-black text-primary">{pipelineStats.active}</p>
        </Card>
        <Card className="premium-card p-3 border-emerald-500/30 bg-emerald-500/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Won</p>
          <p className="text-2xl font-black text-emerald-500">{pipelineStats.won}</p>
        </Card>
        <Card className="premium-card p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Gross Value</p>
          <p className="text-lg font-black">{formatCurrency(pipelineStats.totalValue)}</p>
        </Card>
        <Card className="premium-card p-3 border-accent/30 bg-accent/5 lg:col-span-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Weighted Capital</p>
              <p className="text-lg font-black text-accent">{formatCurrency(pipelineStats.weightedValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Efficiency</p>
              <p className="text-2xl font-black">{Math.round(pipelineStats.avgProbability)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls & Tools */}
      <Card className="premium-card overflow-visible">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Filter by company, asset, or contact..."
              className="pl-12 h-14 bg-background/50 border-border/50 rounded-2xl font-bold focus:ring-primary/30 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={cn(
                "h-14 px-6 rounded-2xl btn-zenith-outline font-black uppercase text-[10px] tracking-widest gap-2",
                (stageFilter.length > 0 || assigneeFilter.length > 0) && "border-primary/50 text-white"
              )}
            >
              <Filter size={18} />
              Filter Matrix
              {(stageFilter.length > 0 || assigneeFilter.length > 0) && (
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px]">
                  {stageFilter.length + assigneeFilter.length}
                </div>
              )}
            </Button>

            <div className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-2xl px-4 h-14">
              <SortAsc size={18} className="text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
              >
                <option value="createdAt">Date Created</option>
                <option value="value">Asset Value</option>
                <option value="probability">Success Prop.</option>
                <option value="company">Consortium</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="ml-2 w-8 h-8 flex items-center justify-center hover:bg-muted/50 rounded-xl transition-colors"
              >
                <TrendingUp size={16} className={cn(sortOrder === 'asc' && "rotate-180 transition-transform")} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-border/40 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-4">Stage Classification</p>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map(stage => (
                      <button
                        key={stage.id}
                        onClick={() => toggleStageFilter(stage.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          stageFilter.includes(stage.id)
                            ? `${stage.color} text-white border-transparent shadow-lg shadow-black/20`
                            : "bg-muted/30 text-muted-foreground border-border/40 hover:border-border/60"
                        )}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-4">Agent Assignment</p>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers?.map(member => (
                      <button
                        key={member.id}
                        onClick={() => toggleAssigneeFilter(member.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-3",
                          assigneeFilter.includes(member.id)
                            ? "bg-primary border-transparent text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-muted/30 text-muted-foreground border-border/40 hover:border-border/60"
                        )}
                      >
                        <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white", member.color?.split(' ')[0])}>
                          {(member.name || 'U').slice(0, 1)}
                        </div>
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {(stageFilter.length > 0 || assigneeFilter.length > 0) && (
                <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-white/5">
                   <div className="flex flex-wrap gap-2">
                      {stageFilter.map(s => (
                        <Badge key={s} variant="secondary" className="pr-1.5 gap-1.5 h-7 rounded-lg">
                          {STAGES.find(st => st.id === s)?.label}
                          <button onClick={() => toggleStageFilter(s)} className="hover:text-foreground"><X size={12} /></button>
                        </Badge>
                      ))}
                      {assigneeFilter.map(m => (
                        <Badge key={m} variant="secondary" className="pr-1.5 gap-1.5 h-7 rounded-lg">
                          {teamMembers?.find(tm => tm.id === m)?.name}
                          <button onClick={() => toggleAssigneeFilter(m)} className="hover:text-foreground"><X size={12} /></button>
                        </Badge>
                      ))}
                   </div>
                   <button onClick={clearFilters} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">Reset Parameters</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Pipeline Surface */}
      <div className="flex-1 min-h-[600px]">
        <MonthlyPipeline
          deals={filteredDeals}
          onDealClick={(deal) => setSelectedDeal(deal)}
          onUpdateDeal={handleUpdateDeal}
          onDeleteDeal={handleDeleteDeal}
          onAddDeal={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* Deployment Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader className="mb-10 text-center">
            <div className="w-16 h-16 rounded-[2rem] bg-primary/20 flex items-center justify-center text-primary mx-auto mb-6 shadow-2xl shadow-primary/20 animate-float">
               <Crosshair size={32} />
            </div>
            <DialogTitle className="text-4xl font-black uppercase tracking-tighter premium-gradient-text border-b border-border/40 pb-4 inline-block mx-auto">DEPLOY OPPORTUNITY</DialogTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-4">Initialize target parameters in the neural matrix</p>
          </DialogHeader>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleAddDeal}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-2">Objective Title *</label>
              <Input name="title" defaultValue={selectedDeal?.title} placeholder="e.g. Enterprise Grade Expansion" className="input-field h-14" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-2">Consortium / Company *</label>
              <Input name="company" defaultValue={selectedDeal?.company} placeholder="e.g. Atlas Corp" className="input-field h-14" required />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-2">Projected Value (THB) *</label>
              <div className="relative">
                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                 <Input name="value" type="number" defaultValue={selectedDeal?.value} placeholder="5,000,000" className="input-field h-14 pl-12 font-black text-lg" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-2">Success Probability (%)</label>
              <Input name="probability" type="number" min="0" max="100" defaultValue={selectedDeal?.probability || 20} placeholder="75" className="input-field h-14 font-black" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-2">Primary Intelligence Contact</label>
              <Input name="contact" defaultValue={selectedDeal?.contact} placeholder="Contact name or lead proxy" className="input-field h-14" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-2">assigned Agent</label>
              <select name="assigned_to" defaultValue={selectedDeal?.assigned_to || 'leader'} className="w-full h-14 input-field px-4 font-bold appearance-none cursor-pointer">
                {teamMembers?.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-2">Source Vector</label>
              <select name="source" defaultValue={selectedDeal?.source || 'inbound'} className="w-full h-14 input-field px-4 font-bold appearance-none cursor-pointer">
                <option value="inbound">Inbound Signal</option>
                <option value="referral">Network Referral</option>
                <option value="cold_call">Direct Outreach</option>
                <option value="marketing">Campaign Matrix</option>
                <option value="website">Portal Entry</option>
              </select>
            </div>

            <div className="flex justify-center gap-4 pt-8 md:col-span-2 mt-4 border-t border-border/40">
              <Button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-zenith-outline h-14 px-10">Abort</Button>
              <Button type="submit" className="btn-zenith-primary h-14 px-12 group">
                 Deploy Deployment <Zap size={18} className="ml-2 group-hover:fill-current transition-all" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
