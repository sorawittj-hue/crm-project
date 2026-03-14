import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import {
  Users, Briefcase, Search, ArrowUpDown,
  Shield, TrendingUp, Clock, CheckCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const ClientCard = ({ client, index, onSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.01, x: 4 }}
    onClick={() => onSelect(client)}
    className="group cursor-pointer"
  >
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Tier Indicator */}
          <div className={cn(
            "w-2 lg:w-3 shrink-0",
            client.tier === 'Platinum' ? "bg-primary" :
              client.tier === 'Gold' ? "bg-amber-500" : "bg-slate-400"
          )} />

          <div className="flex-1 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Client Info */}
            <div className="space-y-3 min-w-0 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                  <Briefcase className="text-muted-foreground" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate group-hover:text-primary transition-colors">{client.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[9px]">{client.tier.toUpperCase()}</Badge>
                    {client.activeCount > 0 && (
                      <Badge className="bg-success/10 text-success text-[9px]">{client.activeCount} Active</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users size={14} /> {client.contact || 'No Contact'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} /> {client.daysSinceLast}d ago
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="flex items-center gap-8 lg:px-8 lg:border-x border-border">
              <div className="text-center lg:text-left">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Value</p>
                <p className="text-xl font-bold tabular-nums">{formatCurrency(client.wonValue)}</p>
              </div>
              <div className="text-center lg:text-left hidden sm:block">
                <p className="text-xs font-medium text-muted-foreground mb-1">Win Rate</p>
                <p className="text-xl font-bold tabular-nums text-success">{client.winRate}%</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-9 px-4">View Details</Button>
              <Button size="sm" className="h-9 w-9 p-0">
                <ArrowUpDown size={16} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

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

      return { ...c, daysSinceLast, winRate, tier };
    });
  }, [deals]);

  const sortedAndFilteredClients = useMemo(() => {
    let result = clients;

    if (activeFilter === 'vip') result = result.filter(c => c.tier !== 'Silver');
    if (activeFilter === 'stagnant') result = result.filter(c => c.daysSinceLast > 30);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s));
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'value') return b.wonValue - a.wonValue;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'recency') return a.daysSinceLast - b.daysSinceLast;
      return 0;
    });

    return result;
  }, [clients, activeFilter, searchTerm, sortBy]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-sm text-muted-foreground">Loading clients...</p>
    </div>
  );

  const totalPortfolioValue = clients.reduce((sum, c) => sum + c.wonValue, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1400px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage your customer portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Shield size={14} className="mr-2" />
            {clients.length} Total Clients
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Portfolio Value</p>
                <p className="text-2xl font-bold tabular-nums">{formatFullCurrency(totalPortfolioValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Active Clients</p>
                <p className="text-2xl font-bold tabular-nums text-primary">{clients.filter(c => c.activeCount > 0).length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <CheckCircle size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">At Risk</p>
                <p className="text-2xl font-bold tabular-nums text-destructive">{clients.filter(c => c.daysSinceLast > 30).length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                <Clock size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/30 p-4 rounded-xl border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search clients..."
              className="pl-9 h-10 w-[280px] bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'vip', 'stagnant'].map(opt => (
              <button
                key={opt}
                onClick={() => setActiveFilter(opt)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-all",
                  activeFilter === opt ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
          >
            <option value="value">Value</option>
            <option value="name">Name</option>
            <option value="recency">Recency</option>
          </select>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedAndFilteredClients.map((client, idx) => (
            <ClientCard
              key={client.id}
              client={client}
              index={idx}
              onSelect={() => { }}
            />
          ))}
        </AnimatePresence>

        {sortedAndFilteredClients.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
            <Users size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No clients found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
