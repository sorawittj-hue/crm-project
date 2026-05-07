import { useState, useMemo } from 'react';
import { useCustomers, useDeleteCustomer, useCreateCustomer } from '../hooks/useCustomers';
import { useDeals } from '../hooks/useDeals';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, formatFullCurrency } from '../lib/formatters';
import { STAGE_LABELS } from '../lib/constants';
import { buildCustomerHealth } from '../utils/salesIntelligence';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Search, Plus, Users, Building2, Mail, Phone,
  Star, ChevronRight, Loader2,
  TrendingUp, DollarSign, BarChart3, Trash2, AlertTriangle, HeartPulse
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/Sheet';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, customerId: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
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
    } catch {}
  };

  const enrichedCustomers = useMemo(() => {
    if (!customers) return [];
    return buildCustomerHealth(customers, deals || []);
  }, [customers, deals]);

  const industries = useMemo(() => {
    const set = new Set(enrichedCustomers.map(c => c.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [enrichedCustomers]);

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
  }, [enrichedCustomers, searchTerm, tierFilter, industryFilter]);

  const totalStats = useMemo(() => {
    const total = filteredCustomers.length;
    const totalWonValue = filteredCustomers.reduce((sum, c) => sum + c.dealStats.wonValue, 0);
    const totalActiveValue = filteredCustomers.reduce((sum, c) => sum + c.dealStats.activeValue, 0);
    const atRiskAccounts = filteredCustomers.filter(c => ['at_risk', 'watch'].includes(c.health?.status)).length;
    return { total, totalWonValue, totalActiveValue, atRiskAccounts };
  }, [filteredCustomers]);

  const isLoading = customersLoading || dealsLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-sm text-slate-400">กำลังโหลดข้อมูลลูกค้า...</p>
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
            onClick={() => { setNewCustomer(EMPTY_FORM); setFormError(null); setIsAddModalOpen(true); }}
            className="h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-md shadow-violet-500/20 border-0"
          >
            <Plus size={14} className="mr-2" /> เพิ่มลูกค้าใหม่
          </Button>
        </div>
      </header>

      {/* KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600"><Users size={20} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400">ลูกค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalStats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><DollarSign size={20} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400">มูลค่ารวมที่ปิดได้</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalStats.totalWonValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><TrendingUp size={20} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400">ดีลที่กำลังดำเนินการ</p>
              <p className="text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(totalStats.totalActiveValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500"><AlertTriangle size={20} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400">บัญชีที่ต้องดูแล</p>
              <p className="text-2xl font-bold text-rose-500 tabular-nums">{totalStats.atRiskAccounts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="ค้นหาลูกค้าด้วยชื่อ, บริษัท, อีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-11 bg-white border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-violet-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              ['all', 'ทั้งหมด'],
              ['grade-A', 'A — VIP'],
              ['grade-B', 'B — ดี'],
              ['grade-C', 'C — ปกติ'],
              ['grade-D', 'D — เสี่ยง'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTierFilter(val)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  tierFilter === val ? "bg-white shadow text-violet-700" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {industries.length > 0 && (
            <select
              value={industryFilter}
              onChange={e => setIndustryFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">อุตสาหกรรม: ทั้งหมด</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* CUSTOMER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer, i) => {
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
                  className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-violet-200 transition-all duration-300 group"
                  onClick={() => { setSelectedCustomer(customer); setIsSidebarOpen(true); }}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white text-base font-bold shadow-sm group-hover:scale-105 transition-transform">
                          {customer.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight group-hover:text-violet-700 transition-colors">{customer.name}</h3>
                          {customer.company && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building2 size={11} /> {customer.company}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {customer._fromDeals && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-blue-200 bg-blue-50 text-blue-600">
                            จากดีล
                          </span>
                        )}
                        {customer.grade ? (
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-black border", GRADE_CONFIG[customer.grade]?.color)}>
                            เกรด {customer.grade}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200">
                            ไม่มีดีล
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      {customer.email && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Mail size={10} /> {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Phone size={10} /> {customer.phone}
                        </span>
                      )}
                      {customer.industry && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <BarChart3 size={10} /> {customer.industry}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">ความแข็งแรง</span>
                        <span className="text-xs font-bold text-slate-500 tabular-nums">{customer.health?.score ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            customer.health?.status === 'at_risk' ? 'bg-rose-500'
                              : customer.health?.status === 'watch' ? 'bg-amber-500'
                              : customer.health?.status === 'growth' ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.max(0, Math.min(100, customer.health?.score || 0))}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">ดีล</p>
                        <p className="text-base font-bold text-slate-900 tabular-nums">{customer.dealStats.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">ปิดได้</p>
                        <p className="text-base font-bold text-emerald-600 tabular-nums">{customer.dealStats.won}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">ปิดแล้ว</p>
                        <p className="text-base font-bold text-violet-700 tabular-nums">{formatCurrency(customer.dealStats.wonValue)}</p>
                      </div>
                    </div>
                    {/* CLV */}
                    {(customer.dealStats.wonValue + (customer.dealStats.activeValue || 0)) > 0 && (
                      <div className="pt-2 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">CLV (Won + Pipeline)</span>
                          <span className="text-xs font-black text-slate-700 tabular-nums">
                            {formatCurrency(customer.dealStats.wonValue + (customer.dealStats.activeValue || 0))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Hover CTA */}
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="flex items-center gap-1 text-xs font-medium text-violet-600">
                        ดูรายละเอียด <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
              <Users size={28} className="text-slate-300" />
            </div>
            <h3 className="text-base font-semibold text-slate-400">ไม่พบข้อมูลลูกค้า</h3>
            <p className="text-sm text-slate-300">ปรับตัวกรองหรือเพิ่มลูกค้าใหม่</p>
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
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCustomer.grade && (
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", GRADE_CONFIG[selectedCustomer.grade]?.color)}>
                      เกรด {selectedCustomer.grade} — {GRADE_CONFIG[selectedCustomer.grade]?.label?.split('—')[1]?.trim()}
                    </span>
                  )}
                  <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", TIER_CONFIG[selectedCustomer.tier]?.color || '')}>
                    {TIER_CONFIG[selectedCustomer.tier]?.icon} {selectedCustomer.tier}
                  </span>
                  {selectedCustomer.industry && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                      {selectedCustomer.industry}
                    </span>
                  )}
                </div>
                {/* Grade description */}
                {selectedCustomer.grade && (
                  <div className={cn('mt-2 p-3 rounded-xl border text-xs', GRADE_CONFIG[selectedCustomer.grade]?.color.replace('text-white', 'text-slate-700').replace(/bg-\w+-\d+/, 'bg-slate-50'))}>
                    <p className="font-bold">{GRADE_CONFIG[selectedCustomer.grade]?.desc}</p>
                    <p className="text-slate-500 mt-0.5">{GRADE_CONFIG[selectedCustomer.grade]?.priority}</p>
                  </div>
                )}
              </SheetHeader>

              {/* Contact Info */}
              <Card className="rounded-[2rem] bg-slate-50 border-none">
                <div className="p-6 space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ข้อมูลติดต่อ</h3>
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

              <Card className="rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <HeartPulse size={16} />
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account health</h3>
                        <p className="text-sm font-bold text-slate-800">
                          {HEALTH_CONFIG[selectedCustomer.health?.status]?.label || 'Healthy'}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-slate-900 tabular-nums">{selectedCustomer.health?.score ?? 0}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Win rate</p>
                      <p className="text-lg font-black text-slate-900 tabular-nums">{selectedCustomer.health?.winRate || 0}%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Risks</p>
                      <p className="text-lg font-black text-rose-500 tabular-nums">{selectedCustomer.health?.riskCount || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Idle</p>
                      <p className="text-lg font-black text-slate-900 tabular-nums">
                        {selectedCustomer.health?.inactiveDays ?? 0}d
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Next best action</p>
                    <p className="text-sm font-bold text-slate-700">{selectedCustomer.health?.nextAction}</p>
                  </div>
                </div>
              </Card>

              {/* Deal Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="rounded-[2rem] bg-slate-50 border-none p-6">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">มูลค่ารวมที่ปิดได้</p>
                  <p className="text-2xl font-black text-emerald-600 tabular-nums">{formatFullCurrency(selectedCustomer.dealStats.wonValue)}</p>
                </Card>
                <Card className="rounded-[2rem] bg-slate-50 border-none p-6">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">ดีลที่กำลังดำเนินการ</p>
                  <p className="text-2xl font-black text-primary tabular-nums">{formatFullCurrency(selectedCustomer.dealStats.activeValue)}</p>
                </Card>
              </div>

              {/* Deal History */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ประวัติดีล ({selectedCustomer.dealStats.total})</h3>
                <div className="space-y-2.5">
                  {selectedCustomer.dealStats.deals.map(deal => (
                    <Card key={deal.id} className="rounded-2xl bg-slate-50 border-none p-4">
                      <div className="flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{deal.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatFullCurrency(deal.value)}
                          </p>
                        </div>
                        <div className={cn("px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
                          deal.stage === 'won' ? 'bg-emerald-50 text-emerald-600' :
                          deal.stage === 'lost' ? 'bg-rose-50 text-rose-500' :
                          'bg-slate-100 text-slate-600'
                        )}>
                          {STAGE_LABELS[deal.stage] || deal.stage}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {selectedCustomer.dealStats.deals.length === 0 && (
                    <p className="text-sm font-bold text-slate-300 text-center py-8">ยังไม่มีดีลที่เชื่อมกับลูกค้าคนนี้</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <Card className="rounded-[2rem] bg-amber-50/50 border-amber-100 p-6">
                  <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">บันทึก</h3>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedCustomer.notes}</p>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedCustomer._fromDeals ? (
                  <Button
                    className="flex-1 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white transition-all font-black text-[10px] uppercase tracking-widest border-0"
                    onClick={() => handleConvertSynthetic(selectedCustomer)}
                    disabled={createCustomerMutation.isPending}
                  >
                    <Plus size={14} className="mr-2" /> บันทึกเป็นลูกค้า
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="flex-1 h-12 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                    onClick={() => setConfirmDelete({ open: true, customerId: selectedCustomer.id })}
                  >
                    <Trash2 size={14} className="mr-2" /> ลบลูกค้า
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ADD CUSTOMER MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[3rem] p-12 border-0 shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-xl font-bold text-slate-900">เพิ่มลูกค้าใหม่</DialogTitle>
            <p className="text-sm text-slate-400 mt-1">กรอกข้อมูลลูกค้าที่ต้องการเพิ่ม</p>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-600">ชื่อลูกค้า *</label>
                <Input
                  required
                  placeholder="เช่น คุณสมชาย ใจดี"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">บริษัท</label>
                <Input
                  placeholder="เช่น บริษัท ABC จำกัด"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">อุตสาหกรรม</label>
                <Input
                  placeholder="เช่น IT, Manufacturing"
                  value={newCustomer.industry}
                  onChange={(e) => setNewCustomer({ ...newCustomer, industry: e.target.value })}
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">อีเมล</label>
                <Input
                  type="email"
                  placeholder="example@company.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">เบอร์โทร</label>
                <Input
                  placeholder="0XX-XXX-XXXX"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-600">ระดับลูกค้า</label>
                <select
                  value={newCustomer.tier}
                  onChange={(e) => setNewCustomer({ ...newCustomer, tier: e.target.value })}
                  className="w-full h-12 rounded-2xl border-0 ring-1 ring-slate-100 bg-slate-50/50 px-4 font-semibold outline-none focus:ring-violet-400"
                >
                  <option value="Silver">🥈 Silver</option>
                  <option value="Gold">🥇 Gold</option>
                  <option value="Platinum">💎 Platinum</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-600">บันทึก</label>
                <Textarea
                  placeholder="บันทึกข้อมูลเพิ่มเติม..."
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="rounded-2xl border-slate-100 bg-slate-50/50 resize-none min-h-[80px] focus:bg-white"
                />
              </div>
            </div>

            {formError && (
              <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
                {formError}
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <Button
                type="button"
                variant="ghost"
                disabled={createCustomerMutation.isPending}
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm text-slate-500"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={createCustomerMutation.isPending}
                className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {createCustomerMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {createCustomerMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกลูกค้า'}
              </Button>
            </div>
          </form>
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
