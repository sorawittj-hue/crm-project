import { useState } from 'react';
import { Search, Filter, X, ChevronDown, DollarSign, Calendar, Tag, User, Sliders } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

const STAGES = [
  { id: 'lead', label: 'Inbound', color: 'bg-blue-500', description: 'New leads not yet engaged' },
  { id: 'contact', label: 'Engagement', color: 'bg-indigo-500', description: 'Initial contact made' },
  { id: 'proposal', label: 'Quotation', color: 'bg-amber-500', description: 'Proposal sent' },
  { id: 'negotiation', label: 'Tactical', color: 'bg-orange-500', description: 'In negotiation' },
  { id: 'won', label: 'Closed', color: 'bg-emerald-500', description: 'Successfully closed' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500', description: 'Lost or rejected' },
];

const QUICK_VIEWS = [
  { id: 'all', label: 'All Deals', icon: Filter },
  { id: 'my-deals', label: 'My Deals', icon: User },
  { id: 'high-value', label: 'High Value (>1M)', icon: DollarSign },
  { id: 'stalled', label: 'Stalled (>14 days)', icon: Calendar },
  { id: 'hot', label: 'Hot Leads', icon: Tag },
];

export default function PipelineFilters({ 
  filters, 
  onChange, 
  onClear, 
  dealCount,
  teamMembers,
  onQuickViewChange,
  activeQuickView 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStageToggle = (stageId) => {
    const newStages = filters.stages.includes(stageId)
      ? filters.stages.filter(s => s !== stageId)
      : [...filters.stages, stageId];
    onChange({ ...filters, stages: newStages });
  };

  return (
    <div className="space-y-4">
      {/* SEARCH AND QUICK VIEWS */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search deals, companies, contacts..."
            value={filters.searchTerm}
            onChange={(e) => onChange({ ...filters, searchTerm: e.target.value })}
            className="pl-9 h-10 bg-white/5 border-white/10 rounded-xl text-sm focus:ring-primary/50"
          />
        </div>

        {/* Quick Views */}
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => onQuickViewChange(view.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all",
                activeQuickView === view.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5"
              )}
            >
              <view.icon size={12} />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Owner Filter */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => onChange({ ...filters, owner: 'all' })} 
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
              filters.owner === 'all' ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            )}
          >
            All
          </button>
          {teamMembers?.map(m => (
            <button 
              key={m.id} 
              onClick={() => onChange({ ...filters, owner: m.id })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                filters.owner === m.id ? "bg-white text-black" : "text-muted-foreground hover:text-white"
              )}
            >
              {m.name || m.id}
            </button>
          ))}
        </div>

        {/* Amount Range */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
          <DollarSign size={14} className="text-muted-foreground" />
          <Input
            placeholder="Min"
            type="number"
            value={filters.minValue || ''}
            onChange={(e) => onChange({ ...filters, minValue: e.target.value ? Number(e.target.value) : null })}
            className="w-20 h-6 bg-transparent border-0 text-xs p-0 focus:ring-0 text-right tabular-nums"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            placeholder="Max"
            type="number"
            value={filters.maxValue || ''}
            onChange={(e) => onChange({ ...filters, maxValue: e.target.value ? Number(e.target.value) : null })}
            className="w-20 h-6 bg-transparent border-0 text-xs p-0 focus:ring-0 text-right tabular-nums"
          />
        </div>

        {/* Stage Filter Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border",
            filters.stages.length < 6
              ? "bg-primary/20 text-primary border-primary/30"
              : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10"
          )}
        >
          <Filter size={14} />
          Stage
          <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* More Filters Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10 transition-all"
        >
          <Sliders size={14} />
          More
        </button>

        {/* Clear Filters */}
        {(filters.searchTerm || filters.stages.length < 6 || filters.owner !== 'all' || filters.minValue || filters.maxValue) && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-white transition-all"
          >
            <X size={14} />
            Clear
          </button>
        )}

        {/* Deal Count */}
        <div className="ml-auto text-[9px] font-black uppercase tracking-wider text-muted-foreground">
          Showing <span className="text-white">{dealCount}</span> deals
        </div>
      </div>

      {/* EXPANDABLE FILTER PANEL */}
      {isOpen && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-black uppercase tracking-wider">Filter Options</h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stages */}
            <div className="space-y-2">
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Pipeline Stage</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageToggle(stage.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-medium transition-all",
                      filters.stages.includes(stage.id)
                        ? "bg-white text-black shadow-lg"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", stage.color)} />
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Close Date Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                    className="pl-9 h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                  />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative flex-1">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                    className="pl-9 h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Priority Level</label>
            <div className="flex gap-2">
              {[
                { id: 'hot', label: '🔥 HOT', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
                { id: 'warm', label: 'WARM', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                { id: 'cold', label: 'COLD', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              ].map(priority => (
                <button
                  key={priority.id}
                  onClick={() => onChange({
                    ...filters,
                    priority: filters.priority === priority.id ? null : priority.id
                  })}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                    filters.priority === priority.id
                      ? priority.color
                      : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10"
                  )}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
