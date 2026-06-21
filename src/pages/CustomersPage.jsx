import { useState, useMemo, useEffect } from 'react';
import { useCustomers, useDeleteCustomer, useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import { useDeals } from '../hooks/useDeals';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

import { useSubscription } from '../hooks/useSubscription';
import { useDebounce } from '../hooks/useDebounce';
import { Card } from '../components/ui/Card';
import MetricTooltip from '../components/ui/MetricTooltip';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, formatFullCurrency } from '../lib/formatters';
import { STAGE_LABELS } from '../lib/constants';
import { buildCustomerHealth } from '../utils/customerIntelligence';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { downloadCsv } from '../utils/exportUtils';
import {
  Search, Plus, Users, Building2, Mail, Phone,
  ChevronRight, Loader2, Download,
  TrendingUp, DollarSign, BarChart3, Trash2, AlertTriangle, HeartPulse,
  Settings, Sparkles, Target, Filter
} from 'lucide-react';


const TIER_CONFIG = {
  Silver: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🥈' },
  Gold: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🥇' },
  Platinum: { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: '💎' },
};

const GRADE_CONFIG = {
  A: {
    color: 'bg-emerald-600 text-white border-emerald-600',
    label: 'A — VIP',
    desc: 'ลูกค้าทองคำ ต้องรักษาให้ดีที่สุด ให้ความสำคัญสูงสุด',
    priority: 'ประจบ / Keep อย่าปล่อย / ง้อได้',
  },
  B: {
    color: 'bg-blue-600 text-white border-blue-600',
    label: 'B — ดี',
    desc: 'ลูกค้าดี มีศักยภาพขยายต่อ',
    priority: 'ดูแลสม่ำเสมอ / หาโอกาส Upsell',
  },
  C: {
    color: 'bg-amber-500 text-white border-amber-500',
    label: 'C — ปกติ',
    desc: 'ลูกค้าทั่วไป ดูแลตามมาตรฐาน',
    priority: 'ดูแลปกติ / หาโอกาสเลื่อนขึ้น B',
  },
  D: {
    color: 'bg-rose-500 text-white border-rose-500',
    label: 'D — เสี่ยง',
    desc: 'ลูกค้าที่ต้องฟื้นฟูหรือพิจารณาปล่อย',
    priority: 'ต้องตัดสินใจ: ฟื้นฟูหรือลดลำดับความสำคัญ',
  },
};

const HEALTH_CONFIG = {
  healthy: { label: 'Healthy', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  growth: { label: 'Growth', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  watch: { label: 'Watch', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  at_risk: { label: 'At risk', color: 'bg-rose-50 text-rose-600 border-rose-100' },
};

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', industry: '', tier: 'Silver', notes: '' };

export default function CustomersPage() {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const deleteCustomerMutation = useDeleteCustomer();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const navigate = useNavigate();
  const { setPendingNewDealCustomer, openPaywall } = useAppStore();

  const { shouldBlockBasic, isGuestAccount } = useSubscription();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, customerId: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  const [activeDetailTab, setActiveDetailTab] = useState('profile'); // profile, playbook, deals
  const [localCustomer, setLocalCustomer] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (selectedCustomer) {
      setLocalCustomer({
        id: selectedCustomer.id,
        name: selectedCustomer.name || '',
        company: selectedCustomer.company || '',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '',
        address: selectedCustomer.address || '',
        tax_id: selectedCustomer.tax_id || '',
        tier: selectedCustomer.tier || 'Silver',
        industry: selectedCustomer.industry || '',
        notes: selectedCustomer.notes || '',
      });
      setActiveDetailTab('profile');
    } else {
      setLocalCustomer(null);
    }
  }, [selectedCustomer]);

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      if (selectedCustomer) {
        setLocalCustomer({
          id: selectedCustomer.id,
          name: selectedCustomer.name || '',
          company: selectedCustomer.company || '',
          email: selectedCustomer.email || '',
          phone: selectedCustomer.phone || '',
          address: selectedCustomer.address || '',
          tax_id: selectedCustomer.tax_id || '',
          tier: selectedCustomer.tier || 'Silver',
          industry: selectedCustomer.industry || '',
          notes: selectedCustomer.notes || '',
        });
      }
      return;
    }
    if (updateCustomerMutation.isPending) return;
    try {
      await updateCustomerMutation.mutateAsync(localCustomer);
      // We will also update the local selectedCustomer state to reflect the edited attributes.
      setSelectedCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...localCustomer,
        };
      });
    } catch (err) {
      console.error('Failed to update customer:', err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }

    if (!newCustomer.name?.trim() && !newCustomer.company?.trim()) {
      setFormError('กรุณาระบุชื่อลูกค้า หรือ ชื่อบริษัท อย่างน้อย 1 อย่าง');
      return;
    }
    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      setFormError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    if (createCustomerMutation.isPending) return;
    setFormError(null);
    try {
      await createCustomerMutation.mutateAsync(newCustomer);
            setIsAddModalOpen(false);
      setNewCustomer(EMPTY_FORM);
    } catch (err) {
      setFormError(err?.message || 'ไม่สามารถบันทึกได้ กรุณาลองใหม่');
    }
  };

  const handleConvertSynthetic = async (customer) => {
    if (!customer._fromDeals) return;
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    try {
      await createCustomerMutation.mutateAsync({
        name: customer.name,
        company: customer.company,
        email: customer.email || '',
        phone: customer.phone || '',
        industry: customer.industry || '',
        tier: 'Silver',
        notes: '',
      });
      setIsSidebarOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      console.error('Failed to reset form:', err);
    }
  };

  const enrichedCustomers = useMemo(() => {
    if (!customers) return [];
    return buildCustomerHealth(customers, deals || []);
  }, [customers, deals]);

  const gradeCounts = useMemo(() => {
    const counts = { all: enrichedCustomers.length, A: 0, B: 0, C: 0, D: 0 };
    enrichedCustomers.forEach(c => {
      if (c.grade && counts[c.grade] !== undefined) {
        counts[c.grade]++;
      }
    });
    return counts;
  }, [enrichedCustomers]);

  const industries = useMemo(() => {
    const set = new Set(enrichedCustomers.map(c => c.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [enrichedCustomers]);

  const filteredCustomers = useMemo(() => {
    let result = enrichedCustomers;
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(c =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.company || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.industry || '').toLowerCase().includes(term)
      );
    }
    if (tierFilter === 'at_risk') {
      result = result.filter(c => ['at_risk', 'watch'].includes(c.health?.status));
    } else if (tierFilter === 'growth') {
      result = result.filter(c => c.health?.status === 'growth');
    } else if (tierFilter.startsWith('grade-')) {
      const g = tierFilter.replace('grade-', '');
      result = result.filter(c => c.grade === g);
    } else if (tierFilter !== 'all') {
      result = result.filter(c => c.tier === tierFilter);
    }
    if (industryFilter !== 'all') result = result.filter(c => c.industry === industryFilter);
    return result;
  }, [enrichedCustomers, debouncedSearchTerm, tierFilter, industryFilter]);

  const totalStats = useMemo(() => {
    const total = filteredCustomers.length;
    const totalWonValue = filteredCustomers.reduce((sum, c) => sum + c.dealStats.wonValue, 0);
    const totalActiveValue = filteredCustomers.reduce((sum, c) => sum + c.dealStats.activeValue, 0);
    const atRiskAccounts = filteredCustomers.filter(c => ['at_risk', 'watch'].includes(c.health?.status)).length;
    return { total, totalWonValue, totalActiveValue, atRiskAccounts };
  }, [filteredCustomers]);

  const exportToCSV = () => {
    const dataToExport = filteredCustomers.map(c => ({
      'ชื่อลูกค้า': c.name || '',
      'บริษัท': c.company || '',
      'อีเมล': c.email || '',
      'เบอร์โทร': c.phone || '',
      'อุตสาหกรรม': c.industry || '',
      'ระดับ (Tier)': c.tier || '',
      'เกรด (Grade)': c.grade || '',
      'สถานะสุขภาพ': HEALTH_CONFIG[c.health?.status]?.label || '',
      'ยอดซื้อรวม': c.dealStats.wonValue || 0,
      'ดีลที่กำลังเปิด': c.dealStats.activeCount || 0,
    }));
    downloadCsv(dataToExport, `customers_${new Date().toISOString().slice(0, 10)}`);
  };

  const isLoading = customersLoading || dealsLoading;

  // Generate gradient avatar color from name
  const getAvatarGradient = (name) => {
    const gradients = [
      ['#6366f1', '#8b5cf6'],
      ['#0ea5e9', '#6366f1'],
      ['#10b981', '#06b6d4'],
      ['#f59e0b', '#ef4444'],
      ['#ec4899', '#8b5cf6'],
      ['#3b82f6', '#06b6d4'],
      ['#14b8a6', '#10b981'],
      ['#f97316', '#ef4444'],
      ['#8b5cf6', '#ec4899'],
      ['#06b6d4', '#3b82f6'],
    ];
    const hash = (name || 'C').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-slate-200 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-2/3" />
              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full" />
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[1,2,3].map(j => <div key={j} className="h-8 bg-slate-100 rounded-lg" />)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-0">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลลูกค้า</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลลูกค้าครบวงจร พร้อมติดตามมูลค่าดีลและประวัติการขาย</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold flex items-center gap-2"
          >
            <Download size={14} /> ส่งออก CSV
          </Button>
          <Button
            onClick={() => {
              if (shouldBlockBasic) {
                openPaywall(isGuestAccount ? 'default' : 'trial_ended');
              } else {
                setNewCustomer(EMPTY_FORM);
                setFormError(null);
                setIsAddModalOpen(true);
              }
            }}
            className="h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-md shadow-violet-500/20 border-0"
          >
            <Plus size={14} className="mr-2" /> เพิ่มลูกค้าใหม่
          </Button>
        </div>
      </header>

      {/* KPI RIBBON */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-[0_8px_30px_rgba(139,92,246,0.3)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(139,92,246,0.4)] transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-violet-100 uppercase tracking-widest">ลูกค้าทั้งหมด</p>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform"><Users size={20} /></div>
            </div>
            <p className="text-3xl font-black tabular-nums tracking-tight drop-shadow-md">{totalStats.total}</p>
            <p className="text-xs font-semibold text-violet-200 mt-1">รายชื่อในระบบ</p>
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)] transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">ปิดได้รวม</p>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform"><DollarSign size={20} /></div>
            </div>
            <p className="text-2xl font-black tabular-nums leading-tight tracking-tight drop-shadow-md">{formatCurrency(totalStats.totalWonValue)}</p>
            <p className="text-xs font-semibold text-emerald-100 mt-1">มูลค่าดีลที่ Won</p>
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_8px_30px_rgba(245,158,11,0.3)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(245,158,11,0.4)] transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">ดีลดำเนินการ</p>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
            </div>
            <p className="text-2xl font-black tabular-nums leading-tight tracking-tight drop-shadow-md">{formatCurrency(totalStats.totalActiveValue)}</p>
            <p className="text-xs font-semibold text-amber-100 mt-1">มูลค่า Pipeline</p>
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_8px_30px_rgba(244,63,94,0.3)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(244,63,94,0.4)] transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest">ต้องดูแลด่วน</p>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform"><AlertTriangle size={20} /></div>
            </div>
            <p className="text-3xl font-black tabular-nums tracking-tight drop-shadow-md">{totalStats.atRiskAccounts}</p>
            <p className="text-xs font-semibold text-rose-100 mt-1">บัญชีเสี่ยง</p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="ค้นหาลูกค้าด้วยชื่อ, บริษัท, อีเมล, อุตสาหกรรม..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 bg-white/80 border-slate-200/60 rounded-[1.25rem] text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-violet-500/20 focus:border-violet-300 shadow-inner transition-all"
          />
          {searchTerm !== debouncedSearchTerm && (
            <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-violet-500 animate-spin" size={18} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100/50 backdrop-blur-sm border border-slate-200/50 p-1.5 rounded-[1.25rem] shadow-inner overflow-x-auto no-scrollbar">
            {[
              { val: 'all', label: 'ทั้งหมด', count: gradeCounts.all, activeClass: 'bg-violet-600 text-white shadow-[0_4px_15px_rgba(124,58,237,0.3)]' },
              { val: 'grade-A', label: 'A', count: gradeCounts.A, activeClass: 'bg-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)]' },
              { val: 'grade-B', label: 'B', count: gradeCounts.B, activeClass: 'bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]' },
              { val: 'grade-C', label: 'C', count: gradeCounts.C, activeClass: 'bg-amber-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)]' },
              { val: 'grade-D', label: 'D', count: gradeCounts.D, activeClass: 'bg-rose-500 text-white shadow-[0_4px_15px_rgba(244,63,94,0.3)]' },
            ].map(({ val, label, count, activeClass }) => (
              <button
                key={val}
                onClick={() => setTierFilter(val)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap',
                  tierFilter === val ? activeClass : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm'
                )}
              >
                {label}
                <span className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  tierFilter === val ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-500'
                )}>{count}</span>
              </button>
            ))}
          </div>
          {industries.length > 0 && (
            <select
              value={industryFilter}
              onChange={e => setIndustryFilter(e.target.value)}
              className="h-14 px-4 bg-white/80 border border-slate-200/60 rounded-[1.25rem] text-xs font-bold text-slate-600 outline-none cursor-pointer focus:bg-white focus:border-violet-300 transition-all shadow-sm shrink-0"
            >
              <option value="all">🏭 อุตสาหกรรม: ทั้งหมด</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* CUSTOMER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <AnimatePresence mode={filteredCustomers.length > 20 ? "sync" : "popLayout"}>
          {filteredCustomers.map((customer) => {
            return (
              <motion.div
                key={customer.id}
                layout={filteredCustomers.length <= 20}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div
                  className="p-6 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 cursor-pointer group relative overflow-hidden transition-all duration-500 hover:shadow-[0_15px_35px_rgb(0,0,0,0.08)] hover:-translate-y-1.5"
                  onClick={() => { setSelectedCustomer(customer); setIsSidebarOpen(true); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  {/* Gradient left border accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(to bottom, ${getAvatarGradient(customer.name)[0]}, ${getAvatarGradient(customer.name)[1]})` }} />

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white text-lg font-black shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative"
                          style={{ background: `linear-gradient(135deg, ${getAvatarGradient(customer.name)[0]}, ${getAvatarGradient(customer.name)[1]})` }}>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-[1.25rem]" />
                          <span className="relative z-10 drop-shadow-md">{customer.name?.charAt(0).toUpperCase() || '?'}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-violet-700 transition-colors">{customer.name}</h3>
                          {customer.company && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building2 size={11} /> {customer.company}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {customer._fromDeals && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-600">
                            จากดีล
                          </span>
                        )}
                        {customer.grade ? (
                          <span className={cn('px-2.5 py-1 rounded-xl text-xs font-black border', GRADE_CONFIG[customer.grade]?.color)}>
                            {customer.grade}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400">
                            —
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact chips */}
                    <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
                      {customer.email && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 truncate max-w-[180px]">
                          <Mail size={10} className="text-slate-400 shrink-0" /> <span className="truncate">{customer.email}</span>
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <Phone size={10} className="text-slate-400" /> {customer.phone}
                        </span>
                      )}
                      {customer.industry && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <BarChart3 size={10} className="text-slate-400" /> {customer.industry}
                        </span>
                      )}
                    </div>

                    {/* Health bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          <MetricTooltip 
                            label="Health Score" 
                            explanation="ค่าคะแนนสุขภาพประเมินผลจากความถี่ในการติดต่อ และจำนวนวันนับตั้งแต่กิจกรรมล่าสุด ยิ่งกิจกรรมขาดช่วงนาน คะแนนจะยิ่งลดลง"
                          />
                        </span>
                        <span className={cn(
                          'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
                          customer.health?.status === 'at_risk' ? 'bg-rose-50 text-rose-600'
                            : customer.health?.status === 'watch' ? 'bg-amber-50 text-amber-600'
                            : customer.health?.status === 'growth' ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        )}>{customer.health?.score ?? 0}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100/60 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, Math.min(100, customer.health?.score || 0))}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full relative"
                          style={{ 
                            background: customer.health?.status === 'at_risk' ? 'linear-gradient(to right, #fda4af, #f43f5e)'
                              : customer.health?.status === 'watch' ? 'linear-gradient(to right, #fcd34d, #f59e0b)'
                              : customer.health?.status === 'growth' ? 'linear-gradient(to right, #93c5fd, #3b82f6)'
                              : 'linear-gradient(to right, #6ee7b7, #10b981)',
                            boxShadow: `0 0 10px ${customer.health?.status === 'at_risk' ? 'rgba(244,63,94,0.4)' : customer.health?.status === 'watch' ? 'rgba(245,158,11,0.4)' : customer.health?.status === 'growth' ? 'rgba(59,130,246,0.4)' : 'rgba(16,185,129,0.4)'}`
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                      <div className="text-center p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] text-slate-400 mb-0.5">ดีลทั้งหมด</p>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{customer.dealStats.total}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-emerald-50">
                        <p className="text-[10px] text-emerald-500 mb-0.5">ปิดได้</p>
                        <p className="text-lg font-black text-emerald-600 tabular-nums">{customer.dealStats.won}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-violet-50">
                        <p className="text-[10px] text-violet-500 mb-0.5">มูลค่า</p>
                        <p className="text-sm font-black text-violet-700 tabular-nums leading-tight">{formatCurrency(customer.dealStats.wonValue)}</p>
                      </div>
                    </div>

                    {/* CLV */}
                    <div className="flex items-center justify-between pt-1">
                      {(customer.dealStats.wonValue + (customer.dealStats.activeValue || 0)) > 0 ? (
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5 flex-1 mr-2">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            <MetricTooltip 
                              label="CLV" 
                              explanation="Customer Lifetime Value: มูลค่าดีลรวมสะสมทั้งหมดของลูกค้ารายนี้ที่อยู่ในระบบ"
                            />
                          </span>
                          <span className="text-xs font-black text-slate-700 tabular-nums">
                            {formatCurrency(customer.dealStats.wonValue + (customer.dealStats.activeValue || 0))}
                          </span>
                        </div>
                      ) : <div />}
                      {/* Hover CTA */}
                      <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        ดูข้อมูล <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredCustomers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-center bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white/50 to-purple-50/50" />
            <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
              <div className="w-28 h-28 bg-white/60 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-violet-500/10 border border-white/80 hover:scale-110 transition-transform duration-500">
                <Users size={48} className="text-violet-600 drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                {searchTerm ? 'ไม่พบข้อมูลลูกค้าที่ค้นหา' : 'ยังไม่มีฐานลูกค้า'}
              </h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                {searchTerm 
                  ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูลูกค้าทั้งหมด'
                  : 'เริ่มต้นสร้างฐานลูกค้าของคุณ เพื่อติดตามสถานะและวิเคราะห์สุขภาพของลูกค้าอย่างมืออาชีพ'}
              </p>
              <button
                onClick={() => {
                  if (shouldBlockBasic) {
                    openPaywall(isGuestAccount ? 'default' : 'trial_ended');
                  } else {
                    if (searchTerm) {
                      setSearchTerm('');
                    } else {
                      setNewCustomer(EMPTY_FORM);
                      setFormError(null);
                      setIsAddModalOpen(true);
                    }
                  }
                }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white text-base font-bold rounded-2xl hover:bg-violet-700 hover:scale-105 transition-all shadow-lg shadow-violet-500/20"
              >
                {searchTerm ? <Filter size={18} /> : <Plus size={18} />}
                {searchTerm ? 'ล้างการค้นหา' : 'เพิ่มลูกค้าใหม่'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOMER DETAIL DIALOG */}
      <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DialogContent className="p-0 border border-white/80 bg-white/95 backdrop-blur-3xl max-w-2xl overflow-y-auto max-h-[90vh] rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)]">
          {selectedCustomer && (
            <div className="p-8 space-y-6 pb-8">
              <DialogHeader className="space-y-4 border-b border-slate-100/80 pb-6 mb-2 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-100/40 to-fuchsia-100/40 rounded-t-[2.5rem] -z-10 -mx-8 -mt-8 px-8 pt-8 pb-6 border-b border-violet-100/50" />
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-[1.5rem]" />
                    <span className="relative z-10 drop-shadow-md">{selectedCustomer.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{selectedCustomer.name}</DialogTitle>
                    {selectedCustomer.company && (
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                        <Building2 size={12} /> {selectedCustomer.company}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCustomer.grade ? (
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", GRADE_CONFIG[selectedCustomer.grade]?.color)}>
                      เกรด {selectedCustomer.grade} — {GRADE_CONFIG[selectedCustomer.grade]?.label?.split('—')[1]?.trim()}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 border border-slate-200">
                      ไม่มีเกรดดีล
                    </span>
                  )}
                  <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", TIER_CONFIG[selectedCustomer.tier]?.color || 'bg-slate-100 text-slate-500 border-slate-200')}>
                    {TIER_CONFIG[selectedCustomer.tier]?.icon || '🥈'} {selectedCustomer.tier || 'Silver'}
                  </span>
                  {selectedCustomer.industry && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                      {selectedCustomer.industry}
                    </span>
                  )}
                </div>
              </DialogHeader>

              {/* Tab Navigation */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
                {[
                  { id: 'profile', label: 'ข้อมูล & แก้ไข', icon: Users },
                  { id: 'playbook', label: 'คู่มือ AI & สุขภาพ', icon: Sparkles },
                  { id: 'deals', label: 'ประวัติดีลการขาย', icon: Target },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeDetailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveDetailTab(tab.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200",
                        isActive
                          ? "bg-white text-violet-750 shadow-sm font-bold border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <Icon size={13} className={isActive ? "text-violet-600" : ""} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <AnimatePresence mode="wait">
                  {activeDetailTab === 'profile' && localCustomer && (
                    <motion.div
                      key="detail-profile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      {selectedCustomer._fromDeals && (
                        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-800 flex items-start gap-2">
                          <AlertTriangle size={15} className="shrink-0 text-blue-500 mt-0.5" />
                          <p>
                            ระบบสร้างข้อมูลลูกค้ารายนี้จากดีลการขายชั่วคราว กรุณากดปุ่ม <strong>&quot;บันทึกเป็นลูกค้าทางการ&quot;</strong> เพื่อยืนยันลงทะเบียนอย่างเป็นทางการ
                          </p>
                        </div>
                      )}

                      <form onSubmit={handleSaveCustomer} className="space-y-4">
                        <div className="grid grid-cols-2 gap-5 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ชื่อลูกค้า *</label>
                            <Input
                              required
                              value={localCustomer.name}
                              onChange={e => setLocalCustomer(p => ({ ...p, name: e.target.value }))}
                              className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm font-bold focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">บริษัท</label>
                            <Input
                              value={localCustomer.company}
                              onChange={e => setLocalCustomer(p => ({ ...p, company: e.target.value }))}
                              className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">อุตสาหกรรม</label>
                            <Input
                              value={localCustomer.industry}
                              onChange={e => setLocalCustomer(p => ({ ...p, industry: e.target.value }))}
                              className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ระดับลูกค้า (Tier)</label>
                            <select
                              value={localCustomer.tier}
                              onChange={e => setLocalCustomer(p => ({ ...p, tier: e.target.value }))}
                              className="w-full h-12 rounded-xl bg-white/80 border border-slate-200/60 px-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20 shadow-inner transition-all cursor-pointer"
                            >
                              <option value="Silver">🥈 Silver</option>
                              <option value="Gold">🥇 Gold</option>
                              <option value="Platinum">💎 Platinum</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">เลขประจำตัวผู้เสียภาษี</label>
                            <Input
                              placeholder="ระบุ Tax ID"
                              value={localCustomer.tax_id || ''}
                              onChange={e => setLocalCustomer(p => ({ ...p, tax_id: e.target.value }))}
                              className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                          <div className="space-y-1.5 col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">อีเมล</label>
                            <Input
                              type="email"
                              value={localCustomer.email}
                              onChange={e => setLocalCustomer(p => ({ ...p, email: e.target.value }))}
                              className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                            />
                          </div>
                          <div className="space-y-1.5 col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">เบอร์โทร</label>
                            <Input
                              value={localCustomer.phone}
                              onChange={e => setLocalCustomer(p => ({ ...p, phone: e.target.value }))}
                              className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ที่อยู่</label>
                            <Input
                              value={localCustomer.address || ''}
                              onChange={e => setLocalCustomer(p => ({ ...p, address: e.target.value }))}
                              className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">บันทึกเพิ่มเติม</label>
                          <Textarea
                            value={localCustomer.notes}
                            onChange={e => setLocalCustomer(p => ({ ...p, notes: e.target.value }))}
                            className="rounded-[1.25rem] bg-white/80 border-slate-200/60 resize-none min-h-[100px] text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all p-4"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          {selectedCustomer._fromDeals ? (
                            <Button
                              type="button"
                              onClick={async () => {
                                await handleConvertSynthetic(selectedCustomer);
                              }}
                              className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-widest border-0 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 transition-all"
                              disabled={createCustomerMutation.isPending}
                            >
                              <Plus size={15} /> บันทึกเป็นลูกค้าทางการ
                            </Button>
                          ) : (
                            <>
                              <Button
                                type="submit"
                                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 transition-all"
                                disabled={updateCustomerMutation.isPending}
                              >
                                {updateCustomerMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                                อัปเดตข้อมูลลูกค้า
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-14 rounded-2xl bg-white/50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                                onClick={() => {
                                  if (shouldBlockBasic) {
                                    openPaywall(isGuestAccount ? 'default' : 'trial_ended');
                                  } else {
                                    setConfirmDelete({ open: true, customerId: selectedCustomer.id });
                                  }
                                }}
                              >
                                <Trash2 size={16} /> ลบลูกค้า
                              </Button>
                            </>
                          )}
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {activeDetailTab === 'playbook' && (
                    <motion.div
                      key="detail-playbook"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      {/* Account Health Meter */}
                      <Card className="rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <HeartPulse size={16} />
                              </div>
                              <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  <MetricTooltip 
                                    label="Account Health Score" 
                                    explanation="ค่าคะแนนสุขภาพประเมินผลจากความถี่ในการติดต่อ และจำนวนวันนับตั้งแต่กิจกรรมล่าสุด ยิ่งกิจกรรมขาดช่วงนาน คะแนนจะยิ่งลดลง"
                                  />
                                </h3>
                                <p className="text-sm font-bold text-slate-800">
                                  {HEALTH_CONFIG[selectedCustomer.health?.status]?.label || 'Healthy'}
                                </p>
                              </div>
                            </div>
                            <span className="text-2xl font-black text-slate-900 tabular-nums">{selectedCustomer.health?.score ?? 0}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedCustomer.health?.score ?? 0}%` }}
                              className={cn(
                                'h-full rounded-full transition-all',
                                selectedCustomer.health?.status === 'at_risk' ? 'bg-rose-500'
                                  : selectedCustomer.health?.status === 'watch' ? 'bg-amber-500'
                                  : selectedCustomer.health?.status === 'growth' ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Win rate</p>
                              <p className="text-base font-black text-slate-900 tabular-nums">{selectedCustomer.health?.winRate || 0}%</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risks</p>
                              <p className="text-base font-black text-rose-500 tabular-nums">{selectedCustomer.health?.riskCount || 0}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Idle Days</p>
                              <p className="text-base font-black text-slate-900 tabular-nums">
                                {selectedCustomer.health?.inactiveDays ?? 0} วัน
                              </p>
                            </div>
                          </div>
                          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">ก้าวสำคัญถัดไป (Next Best Action)</p>
                            <p className="text-xs font-semibold text-slate-700 leading-relaxed">{selectedCustomer.health?.nextAction}</p>
                          </div>
                        </div>
                      </Card>

                      {/* AI Care Playbook Guidance based on Grade */}
                      <Card className="rounded-[2.5rem] border-violet-200/50 bg-violet-50/20 border shadow-sm">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                              <Sparkles size={18} />
                            </div>
                            <div>
                              <h3 className="text-xs font-black uppercase tracking-widest text-violet-750">AI Customer Care Playbook</h3>
                              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">การดูแลแบบแบ่งเกรดอัจฉริยะ</p>
                            </div>
                          </div>

                          {/* Render custom playbook based on grade */}
                          {(() => {
                            const grade = selectedCustomer.grade || 'C'; // default to C if no grade
                            const playbookData = {
                              A: {
                                strategy: 'VIP Strategy: High-touch Engagement',
                                detail: 'ลูกค้ากลุ่มทองคำที่มีมูลค่าสูงสุดและมีประวัติปิดดีลสำเร็จเป็นอย่างดี',
                                actionList: [
                                  'จัดตั้งทีมงานผู้จัดการดูแลลูกค้าคนสำคัญ (Key Account Manager) โดยเฉพาะ',
                                  'นัดคุยความต้องการแบบ High-touch ทุก 3 เดือน (เช่น เลี้ยงรับประทานอาหารกลางวันหรือตีกอล์ฟกระชับมิตร)',
                                  'ส่งของขวัญวันสำคัญ หรือสิทธิพิเศษ VIP ให้ก่อนใคร',
                                  'จัดเตรียมพรีวิวบริการ หรือความช่วยเหลือทางเทคนิกระดับพิเศษด่วนตลอด 24 ชม.'
                                ],
                                cardColor: 'bg-emerald-50 text-emerald-800 border-emerald-100',
                                iconColor: 'text-emerald-500'
                              },
                              B: {
                                strategy: 'Growth Strategy: Upsell & Expansion',
                                detail: 'ลูกค้าที่มีประวัติที่ดีและมีศักยภาพการจัดงบประมาณเพิ่มในอนาคต',
                                actionList: [
                                  'ติดต่อสม่ำเสมอ แนะนำเทคโนโลยี/โซลูชันบริการที่เพิ่งเปิดตัวใหม่',
                                  'เสนอโอกาสทำเวิร์กชอปร่วมกันเพื่อหาโอกาสจัดจ้างเพิ่มเติม (Cross-sell/Upsell)',
                                  'วิเคราะห์ข้อมูลการใช้งานระบบเดิมเพื่อเสนอแผนต่ออายุสัญญาระยะยาว',
                                  'ตอบรับคำขอและคอยประเมินข้อเสนอใหม่ภายใน 24 ชั่วโมง'
                                ],
                                cardColor: 'bg-blue-50 text-blue-800 border-blue-100',
                                iconColor: 'text-blue-500'
                              },
                              C: {
                                strategy: 'Retention Strategy: Relationship Maintenance',
                                detail: 'ลูกค้าทั่วไปที่ไม่มีความเคลื่อนไหวใหญ่แต่มีความสม่ำเสมอในการใช้งาน',
                                actionList: [
                                  'ดูแลตามมาตรฐานอย่างทั่วถึง ป้องกันไม่ให้อัญเชิญเปลี่ยนใจไปหาคู่แข่ง',
                                  'จัดส่งจดหมายข่าวความรู้ข่าวสารระบบ (Newsletters) รายสัปดาห์',
                                  'ส่งแบบประเมินความพึงพอใจการใช้งานทุก 6 เดือนเพื่อเช็คความเสี่ยง',
                                  'ช่วยเหลือให้ข้อมูลในช่องทางซัพพอร์ตตามปกติ'
                                ],
                                cardColor: 'bg-amber-50 text-amber-800 border-amber-100',
                                iconColor: 'text-amber-500'
                              },
                              D: {
                                strategy: 'Recovery Strategy: Customer Rescue Plan',
                                detail: 'ลูกค้าที่เสี่ยงหลุดหรือมีดีลหยุดนิ่งนาน ต้องรีบเข้าทำเพื่อดึงความมั่นใจกลับคืน',
                                actionList: [
                                  'จัดทำแผนฟื้นฟูด่วน (Recovery Plan) นัดประชุมเปิดอกพูดคุยกับผู้บริหารลูกค้าโดยตรง',
                                  'วิเคราะห์ปัญหาและอุปสรรคสำคัญ (Blockers) ที่มีต่อการปิดดีล',
                                  'เสนอแพ็คเกจส่วนลดพิเศษ หรือตัวเลือกทดลองใช้งานฟรีก่อนตัดสินใจใหม่',
                                  'หากประเมินแล้วไม่พร้อมฟื้นฟู ให้จัดสรรความพยายามไปกลุ่มอื่นชั่วคราว'
                                ],
                                cardColor: 'bg-rose-50 text-rose-800 border-rose-100',
                                iconColor: 'text-rose-500'
                              }
                            }[grade] || {
                              strategy: 'Standard Strategy: Standard Care',
                              detail: 'ลูกค้าที่ไม่มีประวัติการขาย ให้ดูแลตามแผนเริ่มต้นมาตรฐาน',
                              actionList: [
                                'ทำความคุ้นเคยสอบถามธุรกิจเบื้องต้น',
                                'แนะนำความเชี่ยวชาญของทีมงานและบริการหลัก'
                              ],
                              cardColor: 'bg-slate-50 text-slate-800 border-slate-100',
                              iconColor: 'text-slate-400'
                            };

                            return (
                              <div className="space-y-5">
                                <div className={cn("p-5 rounded-2xl border shadow-sm", playbookData.cardColor)}>
                                  <h4 className="text-[11px] font-black uppercase tracking-widest mb-1.5">{playbookData.strategy}</h4>
                                  <p className="text-xs opacity-90 leading-relaxed font-semibold">{playbookData.detail}</p>
                                </div>
                                <div className="space-y-3 pt-2">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                    เช็คลิสต์แนะนำ (AI Directives Checklist)
                                  </p>
                                  <ul className="space-y-3">
                                    {playbookData.actionList.map((action, idx) => (
                                      <li key={idx} className="flex items-start gap-3 text-xs group">
                                        <span className={cn("w-6 h-6 rounded-full bg-white border flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300", playbookData.iconColor)}>
                                          {idx + 1}
                                        </span>
                                        <span className="text-slate-700 leading-relaxed font-semibold mt-0.5 group-hover:text-slate-900 transition-colors">{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {activeDetailTab === 'deals' && (
                    <motion.div
                      key="detail-deals"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      {/* Create Deal Direct Connection */}
                      <Button
                        onClick={() => {
                          setPendingNewDealCustomer({
                            id: selectedCustomer.id,
                            name: selectedCustomer.name,
                            company: selectedCustomer.company || '',
                            email: selectedCustomer.email || '',
                            phone: selectedCustomer.phone || '',
                          });
                          setIsSidebarOpen(false);
                          navigate('/pipeline');
                        }}
                        className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-widest border-0 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10"
                      >
                        ➕ สร้างดีลการขายใหม่สำหรับลูกค้ารายนี้
                      </Button>

                      {/* Deal Values Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="rounded-[2rem] bg-slate-50 border-none p-6">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">มูลค่ารวมที่ปิดได้</p>
                          <p className="text-xl font-black text-emerald-600 tabular-nums">{formatFullCurrency(selectedCustomer.dealStats.wonValue)}</p>
                        </Card>
                        <Card className="rounded-[2rem] bg-slate-50 border-none p-6">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ดีลที่กำลังดำเนินการ</p>
                          <p className="text-xl font-black text-violet-750 tabular-nums">{formatFullCurrency(selectedCustomer.dealStats.activeValue)}</p>
                        </Card>
                      </div>

                      {/* Deal List */}
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          ประวัติรายการดีล ({selectedCustomer.dealStats.deals.length})
                        </h3>
                        <div className="space-y-2.5 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
                          {selectedCustomer.dealStats.deals.map(deal => (
                            <Card key={deal.id} className="rounded-2xl bg-white border-slate-100 p-4 border hover:border-violet-200 hover:shadow-md hover:shadow-violet-500/5 transition-all duration-300 group cursor-pointer">
                              <div className="flex justify-between items-center gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate leading-snug group-hover:text-violet-700 transition-colors">{deal.title}</p>
                                  <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-2">
                                    <span className="text-slate-700 font-black">{formatCurrency(deal.value)}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    โอกาสสำเร็จ {deal.probability}%
                                  </p>
                                </div>
                                <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase shrink-0 shadow-sm",
                                  deal.stage === 'won' ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 border border-emerald-200/50' :
                                  deal.stage === 'lost' ? 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-600 border border-rose-200/50' :
                                  'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border border-slate-200/50 group-hover:border-violet-200 group-hover:text-violet-600 group-hover:from-violet-50 group-hover:to-purple-50 transition-colors'
                                )}>
                                  {STAGE_LABELS[deal.stage] || deal.stage}
                                </div>
                              </div>
                            </Card>
                          ))}
                          {selectedCustomer.dealStats.deals.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                <Target size={20} />
                              </div>
                              <p className="text-xs text-slate-400 font-semibold">ยังไม่มีดีลที่เชื่อมโยงกับลูกค้ารายนี้</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD CUSTOMER MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl bg-white/95 backdrop-blur-3xl rounded-[3rem] p-0 border border-white/80 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600" />
          <div className="p-10 pt-8 space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center shrink-0 border border-violet-100 shadow-inner">
                  <Users size={28} className="text-violet-600 drop-shadow-md" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">เพิ่มลูกค้าใหม่</DialogTitle>
                  <p className="text-sm text-slate-500 mt-1 font-medium">กรอกข้อมูลลูกค้าที่ต้องการเพิ่มเข้าสู่ระบบ</p>
                </div>
              </div>
            </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ชื่อลูกค้า *</label>
                <Input
                  required
                  placeholder="เช่น คุณสมชาย ใจดี"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm font-bold focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">บริษัท</label>
                <Input
                  placeholder="เช่น บริษัท ABC จำกัด"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                  className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">อุตสาหกรรม</label>
                <Input
                  placeholder="เช่น IT, Manufacturing"
                  value={newCustomer.industry}
                  onChange={(e) => setNewCustomer({ ...newCustomer, industry: e.target.value })}
                  className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">อีเมล</label>
                <Input
                  type="email"
                  placeholder="example@company.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">เบอร์โทร</label>
                <Input
                  placeholder="0XX-XXX-XXXX"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="h-12 rounded-xl bg-white/80 border-slate-200/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ระดับลูกค้า</label>
                <select
                  value={newCustomer.tier}
                  onChange={(e) => setNewCustomer({ ...newCustomer, tier: e.target.value })}
                  className="w-full h-12 rounded-xl bg-white/80 border border-slate-200/60 px-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20 shadow-inner transition-all cursor-pointer"
                >
                  <option value="Silver">🥈 Silver</option>
                  <option value="Gold">🥇 Gold</option>
                  <option value="Platinum">💎 Platinum</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">บันทึก</label>
                <Textarea
                  placeholder="บันทึกข้อมูลเพิ่มเติม..."
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="rounded-[1.25rem] bg-white/80 border-slate-200/60 resize-none min-h-[100px] text-sm focus:bg-white focus:border-violet-400 focus:ring-violet-400/20 shadow-inner transition-all p-4"
                />
              </div>
            </div>

            {formError && (
              <div className="px-5 py-4 rounded-2xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-bold shadow-sm">
                {formError}
              </div>
            )}

            <div className="pt-2 flex gap-4">
              <Button
                type="button"
                variant="ghost"
                disabled={createCustomerMutation.isPending}
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-14 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={createCustomerMutation.isPending}
                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgba(124,58,237,0.4)] disabled:opacity-70 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all"
              >
                {createCustomerMutation.isPending && <Loader2 size={18} className="animate-spin" />}
                {createCustomerMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกลูกค้า'}
              </Button>
            </div>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, customerId: open ? confirmDelete.customerId : null })}
        title="ลบลูกค้า"
        description="การดำเนินการนี้จะลบลูกค้าถาวร ดีลที่เชื่อมโยงจะถูกเก็บไว้แต่จะถูกยกเลิกการเชื่อมโยง"
        confirmLabel="ลบ"
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
