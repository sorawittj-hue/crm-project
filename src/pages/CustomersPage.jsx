import { useState, useMemo } from 'react';
import { useCustomers, useDeleteCustomer } from '../hooks/useCustomers';
import { useDeals } from '../hooks/useDeals';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, formatFullCurrency } from '../lib/formatters';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Search, Plus, Users, Building2, Mail, Phone,
  Star, ChevronRight, Loader2,
  TrendingUp, DollarSign, BarChart3, Trash2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/Sheet';

const TIER_CONFIG = {
  Silver: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🥈' },
  Gold: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🥇' },
  Platinum: { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: '💎' },
};

export default function CustomersPage() {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const deleteCustomerMutation = useDeleteCustomer();

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, customerId: null });

  // Enrich customers with deal stats
  const enrichedCustomers = useMemo(() => {
    if (!customers) return [];
    const dealMap = {};
    (deals || []).forEach(deal => {
      const cid = deal.customer_id;
      if (!cid) return;
      if (!dealMap[cid]) dealMap[cid] = { total: 0, won: 0, wonValue: 0, activeValue: 0, deals: [] };
      dealMap[cid].total++;
      dealMap[cid].deals.push(deal);
      if (deal.stage === 'won') {
        dealMap[cid].won++;
        dealMap[cid].wonValue += Number(deal.value || 0);
      } else if (deal.stage !== 'lost') {
        dealMap[cid].activeValue += Number(deal.value || 0);
      }
    });

    return customers.map(c => ({
      ...c,
      dealStats: dealMap[c.id] || { total: 0, won: 0, wonValue: 0, activeValue: 0, deals: [] },
    }));
  }, [customers, deals]);

  const filteredCustomers = useMemo(() => {
    let result = enrichedCustomers;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.company?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.industry?.toLowerCase().includes(term)
      );
    }
    if (tierFilter !== 'all') result = result.filter(c => c.tier === tierFilter);
    return result;
  }, [enrichedCustomers, searchTerm, tierFilter]);

  const totalStats = useMemo(() => {
    const total = filteredCustomers.length;
    const totalWonValue = filteredCustomers.reduce((sum, c) => sum + c.dealStats.wonValue, 0);
    const totalActiveValue = filteredCustomers.reduce((sum, c) => sum + c.dealStats.activeValue, 0);
    return { total, totalWonValue, totalActiveValue };
  }, [filteredCustomers]);

  const isLoading = customersLoading || dealsLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Client Intelligence...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto space-y-12 pb-20 px-4 md:px-0">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Users size={18} /></div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Client Relationship Intelligence</p>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Client <span className="text-primary italic">Nexus</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-lg">Comprehensive client portfolio management with real-time deal enrichment and lifetime value tracking.</p>
        </div>

        <div className="flex items-center gap-4">
          <Button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 transition-transform">
            <Plus size={16} className="mr-2" /> New Client
          </Button>
        </div>
      </header>

      {/* KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Clients</p>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{totalStats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><DollarSign size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Value</p>
              <p className="text-3xl font-black text-emerald-600 tabular-nums">{formatCurrency(totalStats.totalWonValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Pipeline</p>
              <p className="text-3xl font-black text-amber-600 tabular-nums">{formatCurrency(totalStats.totalActiveValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <Input
            placeholder="Search clients by name, company, email, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-16 pl-14 bg-white border-slate-200 rounded-[1.5rem] font-bold text-slate-900 placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
          {['all', 'Platinum', 'Gold', 'Silver'].map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={cn(
                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                tierFilter === tier ? "bg-white shadow-xl text-primary" : "text-slate-400 hover:text-slate-900"
              )}
            >
              {tier === 'all' ? 'All Tiers' : tier}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOMER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer, i) => {
            const tierStyle = TIER_CONFIG[customer.tier] || TIER_CONFIG.Silver;
            return (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
              >
                <Card
                  className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm cursor-pointer hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group"
                  onClick={() => { setSelectedCustomer(customer); setIsSidebarOpen(true); }}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform">
                          {customer.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{customer.name}</h3>
                          {customer.company && (
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                              <Building2 size={12} /> {customer.company}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", tierStyle.color)}>
                        {tierStyle.icon} {customer.tier}
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-400">
                      {customer.email && (
                        <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full">
                          <Mail size={10} /> {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full">
                          <Phone size={10} /> {customer.phone}
                        </span>
                      )}
                      {customer.industry && (
                        <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full">
                          <BarChart3 size={10} /> {customer.industry}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deals</p>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{customer.dealStats.total}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Won</p>
                        <p className="text-lg font-black text-emerald-600 tabular-nums">{customer.dealStats.won}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Value</p>
                        <p className="text-lg font-black text-primary tabular-nums">{formatCurrency(customer.dealStats.wonValue)}</p>
                      </div>
                    </div>

                    {/* Hover CTA */}
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest">
                        View Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-20 space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto">
              <Users size={32} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">No Clients Found</h3>
            <p className="text-sm font-bold text-slate-300">Adjust your filters or add a new client.</p>
          </div>
        )}
      </div>

      {/* CUSTOMER DETAIL SIDEBAR */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent className="bg-white border-l border-slate-200 w-full sm:max-w-xl p-0 overflow-y-auto custom-scrollbar">
          {selectedCustomer && (
            <div className="p-8 space-y-8 pb-24">
              <SheetHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-xl">
                    {selectedCustomer.name?.charAt(0)}
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">{selectedCustomer.name}</SheetTitle>
                    {selectedCustomer.company && <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1"><Building2 size={12} /> {selectedCustomer.company}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", TIER_CONFIG[selectedCustomer.tier]?.color || '')}>
                    {TIER_CONFIG[selectedCustomer.tier]?.icon} {selectedCustomer.tier}
                  </span>
                  {selectedCustomer.industry && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                      {selectedCustomer.industry}
                    </span>
                  )}
                </div>
              </SheetHeader>

              {/* Contact Info */}
              <Card className="rounded-[2rem] bg-slate-50 border-none">
                <div className="p-6 space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</h3>
                  <div className="space-y-3">
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><Mail size={14} className="text-slate-400" /></div>
                        <span className="text-sm font-bold text-slate-700">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><Phone size={14} className="text-slate-400" /></div>
                        <span className="text-sm font-bold text-slate-700">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><Building2 size={14} className="text-slate-400" /></div>
                        <span className="text-sm font-bold text-slate-700">{selectedCustomer.address}</span>
                      </div>
                    )}
                    {selectedCustomer.tax_id && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><Star size={14} className="text-slate-400" /></div>
                        <span className="text-sm font-bold text-slate-700">Tax ID: {selectedCustomer.tax_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Deal Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="rounded-[2rem] bg-slate-50 border-none p-6">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lifetime Value</p>
                  <p className="text-2xl font-black text-emerald-600 tabular-nums">{formatFullCurrency(selectedCustomer.dealStats.wonValue)}</p>
                </Card>
                <Card className="rounded-[2rem] bg-slate-50 border-none p-6">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Pipeline</p>
                  <p className="text-2xl font-black text-primary tabular-nums">{formatFullCurrency(selectedCustomer.dealStats.activeValue)}</p>
                </Card>
              </div>

              {/* Deal History */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal History ({selectedCustomer.dealStats.total})</h3>
                <div className="space-y-3">
                  {selectedCustomer.dealStats.deals.map(deal => (
                    <Card key={deal.id} className="rounded-[1.5rem] bg-slate-50 border-none p-5">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-black text-slate-900">{deal.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {deal.stage.toUpperCase()} • {formatFullCurrency(deal.value)}
                          </p>
                        </div>
                        <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase",
                          deal.stage === 'won' ? 'bg-emerald-50 text-emerald-600' :
                          deal.stage === 'lost' ? 'bg-rose-50 text-rose-500' :
                          'bg-slate-100 text-slate-600'
                        )}>
                          {deal.stage}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {selectedCustomer.dealStats.deals.length === 0 && (
                    <p className="text-sm font-bold text-slate-300 text-center py-8">No deals linked to this client</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <Card className="rounded-[2rem] bg-amber-50/50 border-amber-100 p-6">
                  <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Notes</h3>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedCustomer.notes}</p>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-12 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                  onClick={() => setConfirmDelete({ open: true, customerId: selectedCustomer.id })}
                >
                  <Trash2 size={14} className="mr-2" /> Delete Client
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, customerId: open ? confirmDelete.customerId : null })}
        title="Delete Client"
        description="This will permanently delete this client. Linked deals will be preserved but unlinked."
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete.customerId) {
            deleteCustomerMutation.mutate(confirmDelete.customerId);
            setIsSidebarOpen(false);
            setSelectedCustomer(null);
          }
        }}
      />
    </motion.div>
  );
}
