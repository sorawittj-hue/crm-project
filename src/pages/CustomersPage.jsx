import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import {
  Briefcase, Search,
  TrendingUp, Clock, AlertCircle, Star, SortAsc
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const ClientCard = ({ client, index }) => {
  const isStagnant = client.daysSinceLast > 30;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card className="overflow-hidden border-slate-200/60 hover:shadow-lg transition-all">
        <CardContent className="p-0 flex flex-col lg:flex-row">
          <div className={cn("w-1.5 lg:w-2 shrink-0", 
            client.grade === 'VIP' ? "bg-primary" : 
            client.grade === 'Grade A' ? "bg-emerald-500" :
            client.grade === 'Grade B' ? "bg-amber-500" : "bg-slate-300"
          )} />
          
          <div className="flex-1 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-[300px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 transition-colors">
                <Briefcase size={22} className="text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{client.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">{client.grade}</Badge>
                  {isStagnant && <Badge className="bg-rose-50 text-rose-500 text-[9px] border-rose-100 flex items-center gap-1"><AlertCircle size={8} /> Needs Contact</Badge>}
                  {client.activeCount > 0 && <Badge className="bg-primary/5 text-primary text-[9px] border-primary/10">{client.activeCount} Ongoing</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:px-10 lg:border-l lg:border-slate-100 flex-1">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
                <p className="text-base font-black text-slate-900">{formatCurrency(client.wonValue)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Order</p>
                <p className="text-base font-black text-slate-900">{client.daysSinceLast}d ago</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Projects</p>
                <p className="text-base font-black text-slate-900">{client.totalDeals}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-base font-black text-emerald-600">{client.winRate}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-full px-6 h-10 font-bold text-xs uppercase tracking-widest">Profile</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function CustomersPage() {
  const { data: deals, isLoading } = useDeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');

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

  if (isLoading) return <div className="p-20 text-center text-slate-400">Loading Portfolio...</div>;

  const totalWonValue = clients.reduce((sum, c) => sum + c.wonValue, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Intelligence Portfolio</h1>
          <p className="text-muted-foreground font-medium">Customer grading and relationship management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><TrendingUp size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portfolio Worth</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatFullCurrency(totalWonValue)}</p>
        </Card>
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Star size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VIP Clients</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{clients.filter(c => c.grade === 'VIP').length}</p>
        </Card>
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"><Clock size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requires Attention</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{clients.filter(c => c.daysSinceLast > 30).length}</p>
        </Card>
      </div>

      <Card className="p-4 border-slate-200/60 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search portfolio..." 
              className="pl-12 h-12 bg-slate-50 border-transparent rounded-full font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-50 border border-transparent p-1 rounded-full gap-1">
                {['all', 'vip', 'stagnant'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn("px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all", 
                      activeFilter === f ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {f}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-2 bg-slate-50 border border-transparent rounded-full px-4 h-11">
                <SortAsc size={16} className="text-slate-400" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest outline-none">
                   <option value="value">Value</option>
                   <option value="name">Name</option>
                   <option value="recency">Recency</option>
                </select>
             </div>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        <AnimatePresence>
          {filteredClients.map((client, idx) => (
            <ClientCard key={client.id} client={client} index={idx} />
          ))}
        </AnimatePresence>
        {filteredClients.length === 0 && (
          <div className="py-20 text-center text-slate-400 italic">No intelligence matching filters found.</div>
        )}
      </div>
    </motion.div>
  );
}
