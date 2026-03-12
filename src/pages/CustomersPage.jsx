import React, { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { 
  Loader2, Users, Briefcase, 
  ChevronRight, Shield, Search,
  BarChart3, Clock, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Sheet, SheetContent
} from '../components/ui/Sheet';
import { cn } from '../lib/utils';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const ClientIntelligenceNode = React.memo(React.forwardRef(({ client, index, onSelect }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, x: 4 }}
      className="group cursor-pointer"
      onClick={() => onSelect(client)}
    >
      <Card className="bg-white/5 border-white/5 backdrop-blur-xl overflow-hidden hover:bg-white/10 transition-all duration-500 rounded-[2rem]">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Tier Indicator */}
            <div className={cn(
              "w-2 lg:w-3 shrink-0",
              client.tier === 'Platinum' ? "bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]" : 
              client.tier === 'Gold' ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]" : "bg-slate-500"
            )} />
            
            <div className="flex-1 p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Client ID & Info */}
              <div className="space-y-4 min-w-0 max-w-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Briefcase className="text-muted-foreground" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black tracking-tight truncate group-hover:text-primary transition-colors uppercase italic italic">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-white/10 text-[9px] font-black tracking-widest">{client.tier.toUpperCase()} TIER</Badge>
                      {client.activeCount > 0 && <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[9px] font-black tracking-widest">{client.activeCount} ACTIVE SIGNALS</Badge>}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  <div className="flex items-center gap-2"><Users size={14} /> {client.contact || 'No Primary Contact'}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> Last seen {client.daysSinceLast}d ago</div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="flex items-center gap-12 lg:px-12 lg:border-x border-white/5">
                <div className="text-center lg:text-left">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-40">Lifetime Extraction</p>
                  <p className="text-2xl font-black tabular-nums tracking-tighter">{formatCurrency(client.wonValue)}</p>
                </div>
                <div className="text-center lg:text-left hidden sm:block">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-40">Success Rate</p>
                  <p className="text-2xl font-black tabular-nums tracking-tighter text-emerald-500">{client.winRate}%</p>
                </div>
              </div>

              {/* Strategic Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <Button variant="outline" size="sm" className="h-12 border-white/10 bg-white/5 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] hover:bg-white/10">
                  Matrix History
                </Button>
                <Button size="sm" className="h-12 w-12 rounded-xl bg-primary shadow-2xl shadow-primary/20 flex items-center justify-center p-0">
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}));
ClientIntelligenceNode.displayName = 'ClientIntelligenceNode';

const ClientDetailPanel = ({ client }) => {
  if (!client) return null;

  return (
    <div className="space-y-10 py-10">
      <div className="space-y-4">
        <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Briefcase className="text-primary" size={40} />
        </div>
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">{client.name}</h2>
          <Badge variant="outline" className="mt-2 border-white/10 text-[10px] font-black tracking-[0.2em] uppercase">{client.tier} Classification</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-40">Revenue Capture</p>
          <p className="text-2xl font-black tabular-nums tracking-tighter">{formatFullCurrency(client.wonValue)}</p>
        </div>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-40">Win Efficiency</p>
          <p className="text-2xl font-black tabular-nums tracking-tighter text-emerald-500">{client.winRate}%</p>
        </div>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-40">Active Signals</p>
          <p className="text-2xl font-black tabular-nums tracking-tighter text-primary">{client.activeCount}</p>
        </div>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-40">Dormancy Period</p>
          <p className="text-2xl font-black tabular-nums tracking-tighter">{client.daysSinceLast}d</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Recent Deployment History</h3>
        {client.deals.slice(0, 5).map((deal, i) => (
          <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-black/40 border border-white/5 group hover:bg-white/5 transition-colors">
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{deal.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(deal.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black tabular-nums">{formatCurrency(deal.value)}</p>
              <Badge variant="outline" className="text-[9px] border-white/10 uppercase font-black">{deal.stage}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-10 flex gap-4">
        <Button className="flex-1 h-14 rounded-2xl bg-primary font-black uppercase tracking-widest text-[11px]">Deploy Mission</Button>
        <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 font-black uppercase tracking-widest text-[11px]">Strategic Audit</Button>
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const { data: deals, isLoading } = useDeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value'); // value, name, recency
  const [selectedClient, setSelectedClient] = useState(null);

  const clients = useMemo(() => {
    if (!deals) return [];
    const clientMap = {};
    const now = new Date();

    deals.forEach(deal => {
      if (!deal.company) return;
      const name = deal.company.trim();
      const key = name.toLowerCase();

      if (!clientMap[key]) {
        clientMap[key] = {
          id: key,
          name: name,
          contact: deal.contact,
          lastSeen: new Date(deal.createdAt),
          totalDeals: 0,
          wonDeals: 0,
          wonValue: 0,
          activeCount: 0,
          deals: []
        };
      }

      const client = clientMap[key];
      const dealDate = new Date(deal.createdAt);
      if (dealDate > client.lastSeen) client.lastSeen = dealDate;

      client.deals.push(deal);
      client.totalDeals++;
      if (deal.stage === 'won') {
        client.wonDeals++;
        client.wonValue += Number(deal.value || 0);
      } else if (deal.stage !== 'lost') {
        client.activeCount++;
      }
    });

    return Object.values(clientMap).map(c => {
      const daysSinceLast = Math.round((now - c.lastSeen) / 86400000);
      const winRate = c.totalDeals > 0 ? Math.round((c.wonDeals / c.totalDeals) * 100) : 0;
      
      let tier = "Silver";
      if (c.wonValue >= 1000000) tier = "Platinum";
      else if (c.wonValue >= 500000) tier = "Gold";

      // Sort individual client deals by date
      c.deals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return { ...c, daysSinceLast, winRate, tier };
    });
  }, [deals]);

  const sortedAndFilteredClients = useMemo(() => {
    let result = clients;
    
    // Filtering
    if (activeFilter === 'vip') result = result.filter(c => c.tier !== 'Silver');
    if (activeFilter === 'stagnant') result = result.filter(c => c.daysSinceLast > 30);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s));
    }

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'value') return b.wonValue - a.wonValue;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'recency') return a.daysSinceLast - b.daysSinceLast;
      return 0;
    });

    return result;
  }, [clients, activeFilter, searchTerm, sortBy]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Syncing Portfolio Intelligence...</p>
    </div>
  );

  const totalPortfolioValue = clients.reduce((sum, c) => sum + c.wonValue, 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20">
      {/* EXECUTIVE HUD HEADER */}
      <header className="bg-white/5 p-10 rounded-[3rem] border border-white/5 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Shield size={32} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter leading-none uppercase italic">Client Matrix</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mt-3 ml-1">Strategic Portfolio Intelligence • OS v2.0</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-inner">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Total Portfolio LTV</p>
              <p className="text-4xl font-black tabular-nums tracking-tighter">{formatFullCurrency(totalPortfolioValue)}</p>
            </div>
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-inner">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Active Client Nodes</p>
              <p className="text-4xl font-black tabular-nums tracking-tighter text-primary">{clients.length}</p>
            </div>
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-inner">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Critical Churn Risk</p>
              <p className="text-4xl font-black tabular-nums tracking-tighter text-red-500">{clients.filter(c => c.daysSinceLast > 90).length}</p>
            </div>
          </div>
        </div>
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      </header>

      {/* MATRIX CONTROLS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-black/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Query Entity..." 
              className="pl-12 h-14 w-[320px] bg-black/40 border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center bg-black/40 rounded-2xl p-1.5 border border-white/10">
             {['all', 'vip', 'stagnant'].map(opt => (
               <button
                key={opt}
                onClick={() => setActiveFilter(opt)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                  activeFilter === opt ? "bg-white text-black shadow-2xl" : "text-muted-foreground hover:text-white"
                )}
               >
                 {opt}
               </button>
             ))}
          </div>

          <div className="flex items-center gap-3 bg-black/40 rounded-2xl px-4 py-2 border border-white/10">
            <ArrowUpDown size={14} className="text-muted-foreground" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none focus:ring-0 text-muted-foreground"
            >
              <option value="value">Sort by Value</option>
              <option value="name">Sort by Name</option>
              <option value="recency">Sort by Recency</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 border-white/10 bg-white/5 rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all">
            <BarChart3 size={18} className="mr-3" /> Export Intelligence
          </Button>
        </div>
      </div>

      {/* INTELLIGENCE LIST */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {sortedAndFilteredClients.map((client, idx) => (
            <ClientIntelligenceNode 
              key={client.id} 
              client={client} 
              index={idx} 
              onSelect={setSelectedClient}
            />
          ))}
        </AnimatePresence>
        
        {sortedAndFilteredClients.length === 0 && (
          <div className="py-32 text-center opacity-20 border-2 border-dashed border-white rounded-[3rem]">
            <p className="text-xl font-black uppercase tracking-[0.5em]">No Intelligence Found</p>
          </div>
        )}
      </div>

      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="bg-black/95 border-white/10 w-full sm:max-w-xl overflow-y-auto backdrop-blur-3xl">
          <ClientDetailPanel client={selectedClient} onClose={() => setSelectedClient(null)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
