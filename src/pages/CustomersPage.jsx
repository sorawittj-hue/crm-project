import { useMemo, useState, forwardRef } from 'react';
import { useDeals } from '../hooks/useDeals';
import {
  Briefcase, Search,
  TrendingUp, Clock, Star, SortAsc,
  ChevronRight, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const ClientGradeBadge = ({ grade }) => {
  const styles = {
    'VIP': "bg-primary text-white shadow-[0_0_15px_rgba(217,119,6,0.2)]",
    'Grade A': "bg-emerald-500 text-white",
    'Grade B': "bg-amber-100 text-amber-700",
    'Grade C': "bg-slate-100 text-slate-500"
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", styles[grade] || styles['Grade C'])}>
      {grade}
    </span>
  );
};

const ClientCard = forwardRef(({ client, index, onSelect }, ref) => {
  const isStagnant = client.daysSinceLast > 30;
  
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
      onClick={() => onSelect(client)}
    >
      <Card className={cn(
        "p-2 rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative",
        client.grade === 'VIP' ? "bg-gradient-to-br from-white to-primary/5 border-primary/10" : "bg-white"
      )}>
        {client.grade === 'VIP' && (
            <div className="absolute top-0 right-0 p-4">
                <Star size={16} className="text-primary animate-pulse" fill="currentColor" />
            </div>
        )}

        <div className="flex flex-col lg:flex-row items-center gap-6 p-4">
          <div className="flex items-center gap-6 flex-1">
            <div className={cn(
                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-colors",
                client.grade === 'VIP' ? "bg-primary/10 border-primary/20 text-primary" : "bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white"
            )}>
              <Briefcase size={28} />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{client.name}</h3>
                <ClientGradeBadge grade={client.grade} />
              </div>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 line-clamp-1">
                    <Briefcase size={10} /> {client.contact || 'No Primary Contact'}
                </p>
                {client.activeCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {client.activeCount > 0 && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{client.activeCount} Ongoing Projects</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:px-12 lg:border-l lg:border-slate-100 shrink-0">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Portfolio Worth</p>
              <p className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(client.wonValue)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Last Interaction</p>
              <p className={cn("text-lg font-black tabular-nums", isStagnant ? "text-rose-500" : "text-slate-900")}>
                {client.daysSinceLast}d ago
              </p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Deal Volume</p>
              <p className="text-lg font-black text-slate-900 tabular-nums">{client.totalDeals}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Win Velocity</p>
              <p className="text-lg font-black text-emerald-600 tabular-nums">{client.winRate}%</p>
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

ClientCard.displayName = 'ClientCard';

export default function CustomersPage() {
  const { data: deals, isLoading } = useDeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [selectedClient, setSelectedClient] = useState(null);

  const clients = useMemo(() => {
    if (!deals) return [];
    const clientMap = {};
    const now = new Date();

    deals.forEach(deal => {
      if (!deal.company) return;
      const key = deal.company.toLowerCase().trim();
      if (!clientMap[key]) {
        clientMap[key] = {
          id: key,
          name: deal.company,
          contact: deal.contact,
          lastSeen: new Date(deal.createdAt),
          totalDeals: 0,
          wonDeals: 0,
          wonValue: 0,
          activeCount: 0
        };
      }
      const client = clientMap[key];
      const dealDate = new Date(deal.createdAt);
      if (dealDate > client.lastSeen) client.lastSeen = dealDate;
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
      let grade = "Grade C";
      if (c.wonValue >= 5000000) grade = "VIP";
      else if (c.wonValue >= 1000000) grade = "Grade A";
      else if (c.wonValue >= 500000) grade = "Grade B";
      return { ...c, daysSinceLast, winRate, grade };
    });
  }, [deals]);

  const filteredClients = useMemo(() => {
    let res = clients;
    if (activeFilter === 'vip') res = res.filter(c => c.grade === 'VIP');
    if (activeFilter === 'stagnant') res = res.filter(c => c.daysSinceLast > 30);
    if (searchTerm) res = res.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return [...res].sort((a, b) => {
      if (sortBy === 'value') return b.wonValue - a.wonValue;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.daysSinceLast - b.daysSinceLast;
    });
  }, [clients, activeFilter, searchTerm, sortBy]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Index Loading...</p>
    </div>
  );

  const totalWonValue = clients.reduce((sum, c) => sum + c.wonValue, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1500px] mx-auto space-y-12 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl text-primary"><Star size={18} /></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Client Relationship Engine</p>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Intelligence <span className="text-primary italic">Index</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-lg">Global performance tracking across all enterprise sectors and VIP stakeholders.</p>
        </div>
      </div>

      {/* METRIC RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 rounded-[2.5rem] bg-[#141210] text-white border-0 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Aggregate Worth</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{formatFullCurrency(totalWonValue)}</p>
            </div>
            <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
        </Card>
        
        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Priority VIP Assets</p>
              <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{clients.filter(c => c.grade === 'VIP').length} Sector Heads</p>
           </div>
           <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <Star size={24} />
           </div>
        </Card>

        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Recon Required</p>
              <p className="text-3xl font-black text-rose-500 tabular-nums tracking-tighter">{clients.filter(c => c.daysSinceLast > 30).length} Stagnant</p>
           </div>
           <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
              <Clock size={24} />
           </div>
        </Card>
      </div>

      {/* FILTER CONTROL CENTER */}
      <Card className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="relative flex-1 min-w-[350px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="Query intelligence index..." 
              className="pl-14 h-16 bg-slate-50 border-transparent rounded-[1.5rem] font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center bg-slate-50 p-1.5 rounded-full border border-slate-100">
                {['all', 'vip', 'stagnant'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn("px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", 
                      activeFilter === f ? "bg-white shadow-xl text-primary" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {f}
                  </button>
                ))}
             </div>
             <div className="h-10 w-[1px] bg-slate-100 hidden md:block" />
             <div className="flex items-center gap-3 bg-slate-50 rounded-full px-6 h-14 border border-slate-100 group hover:border-primary/20 transition-all">
                <SortAsc size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer text-slate-600">
                   <option value="value">Sort: Value</option>
                   <option value="name">Sort: Name</option>
                   <option value="recency">Sort: Recency</option>
                </select>
             </div>
          </div>
        </div>
      </Card>
      
      {/* PORTFOLIO GRID */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client, idx) => (
            <ClientCard key={client.id} client={client} index={idx} onSelect={setSelectedClient} />
          ))}
        </AnimatePresence>
        
        {filteredClients.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                <Filter size={32} />
            </div>
            <div className="space-y-1">
                <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">No intelligence detected</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust filters to re-scan sectors.</p>
            </div>
            <Button variant="ghost" onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} className="text-[10px] font-black uppercase tracking-widest text-primary">Clear all parameters</Button>
          </motion.div>
        )}
      </div>

      {/* SELECTED CLIENT SIDEBAR/DRAWER (Future Expansion) */}
      <AnimatePresence>
        {selectedClient && (
            <div className="hidden">
                {/* Reserved for Detail Sidebar */}
            </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Loader2(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size} 
      height={props.size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// End of File
