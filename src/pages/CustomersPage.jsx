import { useState, useMemo, useEffect } from 'react';
import { useCustomers, useDeleteCustomer, useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import { useDeals } from '../hooks/useDeals';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useSubscription } from '../hooks/useSubscription';
import { useCustomerContacts } from '../hooks/useCustomerContacts';
import { useDebounce } from '../hooks/useDebounce';
import MetricTooltip from '../components/ui/MetricTooltip';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
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
  ChevronRight, Loader2, Download, Upload,
  TrendingUp, DollarSign, BarChart3, Trash2, AlertTriangle, HeartPulse,
  Settings, Sparkles, Target, Filter, Contact, Pencil, Star, LayoutGrid, List,
  ArrowUpDown, X, CheckCircle2, ExternalLink, ChevronDown
} from 'lucide-react';
import CustomerCSVImport from '../components/CustomerCSVImport';

// ─── Config ────────────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  Silver: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🥈', gradient: 'from-slate-400 to-slate-500' },
  Gold: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🥇', gradient: 'from-amber-400 to-orange-400' },
  Platinum: { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: '💎', gradient: 'from-violet-500 to-indigo-500' },
};

const GRADE_CONFIG = {
  A: { color: 'bg-emerald-500 text-white border-emerald-500', label: 'A — VIP', desc: 'ลูกค้าทองคำ', priority: 'ประจบ / Keep อย่าปล่อย', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  B: { color: 'bg-blue-500 text-white border-blue-500', label: 'B — ดี', desc: 'ลูกค้าดี มีศักยภาพ', priority: 'ดูแลสม่ำเสมอ / Upsell', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  C: { color: 'bg-amber-500 text-white border-amber-500', label: 'C — ปกติ', desc: 'ลูกค้าทั่วไป', priority: 'ดูแลปกติ', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  D: { color: 'bg-rose-500 text-white border-rose-500', label: 'D — เสี่ยง', desc: 'ต้องฟื้นฟูหรือปล่อย', priority: 'ฟื้นฟูหรือลดลำดับ', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
};

const HEALTH_BADGE = {
  healthy: { label: 'Healthy', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  growth: { label: 'Growth', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  watch: { label: 'Watch', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  at_risk: { label: 'At Risk', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
};

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', industry: '', tier: 'Silver', notes: '' };

// ─── Avatar gradient ───────────────────────────────────────────────────────────
const getAvatarGradient = (name) => {
  const gradients = [
    ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#6366f1'], ['#10b981', '#06b6d4'],
    ['#f59e0b', '#ef4444'], ['#ec4899', '#8b5cf6'], ['#3b82f6', '#06b6d4'],
    ['#14b8a6', '#10b981'], ['#f97316', '#ef4444'], ['#8b5cf6', '#ec4899'],
    ['#06b6d4', '#3b82f6'],
  ];
  const hash = (name || 'C').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function HealthBar({ score, status }) {
  const colors = {
    at_risk: 'from-rose-400 to-rose-500',
    watch: 'from-amber-400 to-amber-500',
    growth: 'from-blue-400 to-blue-500',
    healthy: 'from-emerald-400 to-emerald-500',
  };
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, score || 0))}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${colors[status] || colors.healthy}`}
      />
    </div>
  );
}

// ─── Customer Card (Grid) ──────────────────────────────────────────────────────
function CustomerCard({ customer, onOpen, onSelect, isSelected }) {
  const [g1, g2] = getAvatarGradient(customer.name);
  const gradeConf = GRADE_CONFIG[customer.grade];
  const healthConf = HEALTH_BADGE[customer.health?.status] || HEALTH_BADGE.healthy;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group bg-white rounded-3xl border p-5 cursor-pointer relative overflow-hidden transition-all duration-300',
        'hover:border-violet-200 hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:-translate-y-1',
        isSelected ? 'border-violet-300 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]' : 'border-slate-100 shadow-sm',
      )}
      onClick={() => onOpen(customer)}
    >
      {/* Checkbox */}
      <div
        className="absolute top-4 right-4 z-10"
        onClick={e => { e.stopPropagation(); onSelect(customer.id); }}
      >
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
          isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300 bg-white group-hover:border-violet-400'
        )}>
          {isSelected && <CheckCircle2 size={13} className="text-white" />}
        </div>
      </div>

      {/* Subtle gradient strip on hover */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(to bottom, ${g1}, ${g2})` }}
      />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3 pr-7">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black shrink-0 shadow-md transition-transform group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
          >
            {customer.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
              {customer.name}
            </h3>
            {customer.company && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <Building2 size={10} className="shrink-0" />
                {customer.company}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {customer.grade && gradeConf && (
            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg border', gradeConf.color)}>
              {customer.grade}
            </span>
          )}
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg border', healthConf.cls)}>
            {healthConf.label}
          </span>
          {customer.industry && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 truncate max-w-[100px]">
              {customer.industry}
            </span>
          )}
        </div>

        {/* Health bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-slate-400">Health Score</span>
            <span className={cn(
              customer.health?.status === 'at_risk' ? 'text-rose-500'
                : customer.health?.status === 'watch' ? 'text-amber-500'
                : customer.health?.status === 'growth' ? 'text-blue-500'
                : 'text-emerald-500'
            )}>
              {customer.health?.score ?? 0}%
            </span>
          </div>
          <HealthBar score={customer.health?.score} status={customer.health?.status} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-50">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">ดีลรวม</p>
            <p className="text-base font-black text-slate-800">{customer.dealStats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-emerald-600 font-medium mb-0.5">ปิดได้</p>
            <p className="text-base font-black text-emerald-600">{customer.dealStats.won}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-violet-600 font-medium mb-0.5">CLV</p>
            <p className="text-xs font-black text-violet-700 leading-tight">
              {formatCurrency(customer.dealStats.wonValue + (customer.dealStats.activeValue || 0))}
            </p>
          </div>
        </div>

        {/* Contact quick actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                onClick={e => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all"
                title={customer.email}
              >
                <Mail size={13} />
              </a>
            )}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                onClick={e => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all"
                title={customer.phone}
              >
                <Phone size={13} />
              </a>
            )}
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
            ดูข้อมูล <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Customer Row (List) ───────────────────────────────────────────────────────
function CustomerRow({ customer, onOpen, onSelect, isSelected }) {
  const [g1, g2] = getAvatarGradient(customer.name);
  const gradeConf = GRADE_CONFIG[customer.grade];
  const healthConf = HEALTH_BADGE[customer.health?.status] || HEALTH_BADGE.healthy;

  return (
    <tr
      className={cn(
        'group cursor-pointer transition-colors',
        isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'
      )}
      onClick={() => onOpen(customer)}
    >
      <td className="p-4 w-12" onClick={e => e.stopPropagation()}>
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
            isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
          )}
          onClick={() => onSelect(customer.id)}
        >
          {isSelected && <CheckCircle2 size={11} className="text-white" />}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0"
            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
          >
            {customer.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">{customer.name}</p>
            {customer.company && <p className="text-xs text-slate-400">{customer.company}</p>}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1.5">
          {customer.grade && gradeConf && (
            <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black border', gradeConf.color)}>
              {customer.grade}
            </span>
          )}
          <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-bold border', TIER_CONFIG[customer.tier]?.color || 'bg-slate-100 text-slate-500 border-slate-200')}>
            {TIER_CONFIG[customer.tier]?.icon} {customer.tier || 'Silver'}
          </span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${customer.health?.score ?? 0}%`,
                background: customer.health?.status === 'at_risk' ? '#f43f5e'
                  : customer.health?.status === 'watch' ? '#f59e0b'
                  : customer.health?.status === 'growth' ? '#3b82f6'
                  : '#10b981'
              }}
            />
          </div>
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', healthConf.cls)}>
            {customer.health?.score ?? 0}%
          </span>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm font-black text-slate-800">
          {formatCurrency(customer.dealStats.wonValue + (customer.dealStats.activeValue || 0))}
        </span>
      </td>
      <td className="p-4">
        <span className="text-xs text-slate-500">
          <strong className="text-slate-800">{customer.dealStats.total}</strong> ดีล
          {customer.dealStats.won > 0 && (
            <span className="text-emerald-600 ml-1">(Won: {customer.dealStats.won})</span>
          )}
        </span>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          {customer.email && <span className="text-xs text-slate-500 truncate max-w-[140px]">{customer.email}</span>}
          {customer.phone && <span className="text-[11px] text-slate-400 font-mono">{customer.phone}</span>}
        </div>
      </td>
      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onOpen(customer)}
          className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </td>
    </tr>
  );
}

// ─── Detail Side Panel ─────────────────────────────────────────────────────────
function CustomerDetailPanel({
  customer, onClose, contacts, isContactFormOpen, setIsContactFormOpen,
  editingContact, setEditingContact, contactForm, setContactForm, handleContactSubmit,
  deleteContact, localCustomer, setLocalCustomer, handleSaveCustomer, updateCustomerMutation,
  createCustomerMutation, deleteCustomerMutation, handleConvertSynthetic,
  setConfirmDelete, setPendingNewDealCustomer, navigate, setIsSidebarOpen, shouldBlockBasic, openPaywall, isGuestAccount,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [g1, g2] = getAvatarGradient(customer.name);
  const gradeConf = GRADE_CONFIG[customer.grade];
  const healthConf = HEALTH_BADGE[customer.health?.status] || HEALTH_BADGE.healthy;

  const tabs = [
    { id: 'profile', label: 'ข้อมูล', icon: Users },
    { id: 'playbook', label: 'AI Playbook', icon: Sparkles },
    { id: 'deals', label: 'ดีล', icon: Target },
    { id: 'contacts', label: 'ผู้ติดต่อ', icon: Contact },
  ];

  const playbookData = {
    A: {
      strategy: 'VIP High-touch Engagement',
      detail: 'ลูกค้าทองคำ — ให้ความสำคัญสูงสุด เป็นรายได้หลักของทีม',
      actions: [
        'จัด Key Account Manager ดูแลโดยเฉพาะ',
        'นัดคุยแบบ High-touch ทุก 3 เดือน',
        'ส่งของขวัญ/สิทธิพิเศษ VIP ในโอกาสสำคัญ',
        'จัดบริการ Premium Support ตลอด 24 ชม.',
      ],
      colorClass: 'from-emerald-50 to-green-50 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    B: {
      strategy: 'Growth — Upsell & Expand',
      detail: 'ลูกค้าที่มีศักยภาพขยายงบประมาณได้อีก',
      actions: [
        'แนะนำโซลูชัน/บริการใหม่อย่างสม่ำเสมอ',
        'จัดเวิร์กชอปร่วมเพื่อหาโอกาส Cross-sell',
        'เสนอแผนต่ออายุระยะยาวก่อนกำหนด',
        'ตอบสนองคำขอภายใน 24 ชั่วโมง',
      ],
      colorClass: 'from-blue-50 to-sky-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
    },
    C: {
      strategy: 'Retention — Keep & Maintain',
      detail: 'ลูกค้าสม่ำเสมอ ป้องกันไม่ให้เปลี่ยนใจไปคู่แข่ง',
      actions: [
        'ส่ง Newsletter ข่าวสารระบบรายสัปดาห์',
        'ทำแบบสอบถามความพึงพอใจทุก 6 เดือน',
        'ช่วยเหลือในช่องทาง Support ตามปกติ',
        'หาโอกาสเลื่อนขึ้นไปเกรด B',
      ],
      colorClass: 'from-amber-50 to-yellow-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-800',
    },
    D: {
      strategy: 'Recovery — Customer Rescue',
      detail: 'ลูกค้าเสี่ยงหลุด ต้องเข้าแก้ไขด่วน',
      actions: [
        'นัดประชุมเปิดอกกับผู้บริหารลูกค้าโดยตรง',
        'วิเคราะห์ปัญหาและ Blockers ที่มีอยู่',
        'เสนอส่วนลดพิเศษหรือทดลองใช้งานฟรี',
        'ประเมิน: ฟื้นฟูหรือจัดสรรทรัพยากรใหม่',
      ],
      colorClass: 'from-rose-50 to-red-50 border-rose-200',
      badge: 'bg-rose-100 text-rose-800',
    },
  }[customer.grade] || {
    strategy: 'Standard Care',
    detail: 'ลูกค้าที่ยังไม่มีประวัติดีล',
    actions: ['ทำความรู้จักธุรกิจเบื้องต้น', 'แนะนำบริการหลักของทีม'],
    colorClass: 'from-slate-50 to-gray-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="relative p-6 pb-0">
        {/* Gradient bg */}
        <div
          className="absolute inset-x-0 top-0 h-32 opacity-10 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
        />
        <div className="relative z-10">
          {/* Close + actions row */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2">
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="ส่งอีเมล">
                  <Mail size={18} />
                </a>
              )}
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="โทรออก">
                  <Phone size={18} />
                </a>
              )}
              <button
                onClick={() => {
                  setPendingNewDealCustomer({ id: customer.id, name: customer.name, company: customer.company || '', email: customer.email || '', phone: customer.phone || '' });
                  setIsSidebarOpen(false);
                  navigate('/pipeline');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20"
              >
                <Plus size={14} /> สร้างดีล
              </button>
            </div>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl ring-4 ring-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
            >
              {customer.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{customer.name}</h2>
              {customer.company && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 size={13} /> {customer.company}
                </p>
              )}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {customer.grade && gradeConf && (
              <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black border', gradeConf.color)}>
                เกรด {customer.grade} — {gradeConf.desc}
              </span>
            )}
            <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold border', healthConf.cls)}>
              <HeartPulse size={9} className="inline mr-1" />{healthConf.label} {customer.health?.score ?? 0}%
            </span>
            {customer.tier && (
              <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold border', TIER_CONFIG[customer.tier]?.color || 'bg-slate-100 text-slate-500 border-slate-200')}>
                {TIER_CONFIG[customer.tier]?.icon} {customer.tier}
              </span>
            )}
            {customer.industry && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                {customer.industry}
              </span>
            )}
          </div>

          {/* KPI mini strip */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'ดีลรวม', val: customer.dealStats.total, color: 'text-slate-800' },
              { label: 'Won', val: customer.dealStats.won, color: 'text-emerald-600' },
              { label: 'CLV', val: formatCurrency(customer.dealStats.wonValue + (customer.dealStats.activeValue || 0)), color: 'text-violet-700' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium mb-0.5">{label}</p>
                <p className={cn('text-sm font-black', color)}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 -mx-6 px-6 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap',
                  active
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                )}
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ── PROFILE tab ── */}
          {activeTab === 'profile' && localCustomer && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-5">
              {customer._fromDeals && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-blue-500 mt-0.5" />
                  ระบบสร้างข้อมูลนี้จากดีล กรุณากด <strong>"บันทึกเป็นลูกค้าทางการ"</strong> เพื่อยืนยัน
                </div>
              )}

              <form onSubmit={handleSaveCustomer} className="space-y-4">
                {/* Name + Company */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ชื่อลูกค้า *</label>
                    <Input required value={localCustomer.name} onChange={e => setLocalCustomer(p => ({ ...p, name: e.target.value }))} className="h-11 rounded-xl text-sm font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">บริษัท</label>
                      <Input value={localCustomer.company} onChange={e => setLocalCustomer(p => ({ ...p, company: e.target.value }))} className="h-11 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">อุตสาหกรรม</label>
                      <Input value={localCustomer.industry} onChange={e => setLocalCustomer(p => ({ ...p, industry: e.target.value }))} className="h-11 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">อีเมล</label>
                      <Input type="email" value={localCustomer.email} onChange={e => setLocalCustomer(p => ({ ...p, email: e.target.value }))} className="h-11 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เบอร์โทร</label>
                      <Input value={localCustomer.phone} onChange={e => setLocalCustomer(p => ({ ...p, phone: e.target.value }))} className="h-11 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ระดับลูกค้า</label>
                    <select value={localCustomer.tier} onChange={e => setLocalCustomer(p => ({ ...p, tier: e.target.value }))} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400">
                      <option value="Silver">🥈 Silver</option>
                      <option value="Gold">🥇 Gold</option>
                      <option value="Platinum">💎 Platinum</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax ID</label>
                    <Input placeholder="ระบุเลขประจำตัวผู้เสียภาษี" value={localCustomer.tax_id || ''} onChange={e => setLocalCustomer(p => ({ ...p, tax_id: e.target.value }))} className="h-11 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">บันทึก</label>
                    <Textarea value={localCustomer.notes} onChange={e => setLocalCustomer(p => ({ ...p, notes: e.target.value }))} className="rounded-xl resize-none min-h-[80px] text-sm" />
                  </div>
                </div>

                <div className="flex gap-3">
                  {customer._fromDeals ? (
                    <Button type="button" onClick={() => handleConvertSynthetic(customer)} className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs border-0" disabled={createCustomerMutation.isPending}>
                      <Plus size={14} className="mr-1.5" /> บันทึกเป็นลูกค้าทางการ
                    </Button>
                  ) : (
                    <>
                      <Button type="submit" className="flex-[2] h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm border-0 shadow-md" disabled={updateCustomerMutation.isPending}>
                        {updateCustomerMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Settings size={14} className="mr-1.5" />}
                        บันทึก
                      </Button>
                      <Button type="button" variant="ghost" className="flex-1 h-11 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 font-bold text-sm"
                        onClick={() => shouldBlockBasic ? openPaywall(isGuestAccount ? 'default' : 'trial_ended') : setConfirmDelete({ open: true, customerId: customer.id })}>
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </motion.div>
          )}

          {/* ── PLAYBOOK tab ── */}
          {activeTab === 'playbook' && (
            <motion.div key="playbook" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-5">
              {/* Health metrics */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={16} className="text-violet-500" />
                    <span className="text-sm font-bold text-slate-800">Account Health</span>
                  </div>
                  <span className="text-xl font-black text-slate-900">{customer.health?.score ?? 0}%</span>
                </div>
                <HealthBar score={customer.health?.score} status={customer.health?.status} />
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-emerald-700 font-bold uppercase">Win Rate</p>
                    <p className="text-sm font-black text-emerald-700">{customer.health?.winRate || 0}%</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-rose-700 font-bold uppercase">Risks</p>
                    <p className="text-sm font-black text-rose-600">{customer.health?.riskCount || 0}</p>
                  </div>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Idle Days</p>
                    <p className="text-sm font-black text-slate-900">{customer.health?.inactiveDays ?? 0}</p>
                  </div>
                </div>
                {customer.health?.nextAction && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Next Best Action</p>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{customer.health.nextAction}</p>
                  </div>
                )}
              </div>

              {/* AI Playbook */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">AI Care Playbook</p>
                    <p className="text-[10px] text-slate-400">{playbookData.strategy}</p>
                  </div>
                </div>
                <div className={cn('p-4 rounded-2xl border bg-gradient-to-br mb-4', playbookData.colorClass)}>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">{playbookData.detail}</p>
                </div>
                <ul className="space-y-2.5">
                  {playbookData.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5', playbookData.badge)}>
                        {i + 1}
                      </span>
                      <span className="text-slate-700 leading-snug font-medium">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* ── DEALS tab ── */}
          {activeTab === 'deals' && (
            <motion.div key="deals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">ปิดได้รวม</p>
                  <p className="text-lg font-black text-emerald-700">{formatFullCurrency(customer.dealStats.wonValue)}</p>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">กำลังดำเนินการ</p>
                  <p className="text-lg font-black text-violet-700">{formatFullCurrency(customer.dealStats.activeValue)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ประวัติดีล ({customer.dealStats.deals.length})
                </p>
                <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                  {customer.dealStats.deals.map(deal => (
                    <div key={deal.id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-sm transition-all group">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-violet-700 transition-colors">{deal.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <strong className="text-slate-800">{formatCurrency(deal.value)}</strong>
                            <span className="mx-1 text-slate-300">·</span>
                            {deal.probability}%
                          </p>
                        </div>
                        <span className={cn(
                          'text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0',
                          deal.stage === 'won' ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : deal.stage === 'lost' ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:border-violet-200 group-hover:text-violet-600 group-hover:bg-violet-50 transition-colors'
                        )}>
                          {STAGE_LABELS[deal.stage] || deal.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                  {customer.dealStats.deals.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Target size={24} className="text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">ยังไม่มีดีล</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CONTACTS tab ── */}
          {activeTab === 'contacts' && (
            <motion.div key="contacts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">ผู้ติดต่อ ({contacts.length})</p>
                <Button onClick={() => { setEditingContact(null); setContactForm({ full_name: '', role: '', email: '', phone: '', is_primary: false }); setIsContactFormOpen(true); }}
                  className="h-8 px-3 rounded-lg bg-violet-600 text-white text-xs font-bold border-0">
                  <Plus size={13} className="mr-1" /> เพิ่ม
                </Button>
              </div>

              <AnimatePresence>
                {isContactFormOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                      <form onSubmit={handleContactSubmit} className="space-y-3">
                        <p className="text-xs font-bold text-violet-700">{editingContact ? 'แก้ไขผู้ติดต่อ' : 'เพิ่มผู้ติดต่อใหม่'}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">ชื่อ-นามสกุล *</label>
                            <Input required value={contactForm.full_name} onChange={e => setContactForm(p => ({ ...p, full_name: e.target.value }))} className="h-9 text-xs bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">ตำแหน่ง</label>
                            <Input value={contactForm.role} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} className="h-9 text-xs bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">อีเมล</label>
                            <Input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-xs bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">เบอร์โทร</label>
                            <Input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} className="h-9 text-xs bg-white" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm(p => ({ ...p, is_primary: e.target.checked }))} className="rounded accent-violet-600" />
                          ตั้งเป็นผู้ติดต่อหลัก
                        </label>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" onClick={() => setIsContactFormOpen(false)} className="h-8 text-xs text-slate-500">ยกเลิก</Button>
                          <Button type="submit" className="h-8 px-4 rounded-lg bg-violet-600 text-white text-xs font-bold border-0">บันทึก</Button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                {contacts.length === 0 && !isContactFormOpen && (
                  <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Contact size={24} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">ยังไม่มีผู้ติดต่อ</p>
                  </div>
                )}
                {contacts.map(contact => (
                  <div key={contact.id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-100 transition-all group flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm">
                      {contact.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 truncate">{contact.full_name}</p>
                        {contact.is_primary && <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500">{contact.role || '—'}</p>
                      <div className="flex gap-3 mt-1">
                        {contact.email && <span className="text-[11px] text-slate-400">{contact.email}</span>}
                        {contact.phone && <span className="text-[11px] text-slate-400 font-mono">{contact.phone}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingContact(contact); setContactForm(contact); setIsContactFormOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => { if (confirm('ต้องการลบผู้ติดต่อนี้?')) deleteContact(contact.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
  const [gradeFilter, setGradeFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, customerId: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [localCustomer, setLocalCustomer] = useState(null);
  const { contacts, addContact, updateContact, deleteContact } = useCustomerContacts(selectedCustomer?.id);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({ full_name: '', role: '', email: '', phone: '', is_primary: false });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Sync localCustomer when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      setLocalCustomer({
        id: selectedCustomer.id, name: selectedCustomer.name || '',
        company: selectedCustomer.company || '', email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '', address: selectedCustomer.address || '',
        tax_id: selectedCustomer.tax_id || '', tier: selectedCustomer.tier || 'Silver',
        industry: selectedCustomer.industry || '', notes: selectedCustomer.notes || '',
      });
    } else { setLocalCustomer(null); }
  }, [selectedCustomer]);

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) { openPaywall(isGuestAccount ? 'default' : 'trial_ended'); return; }
    if (updateCustomerMutation.isPending) return;
    try {
      await updateCustomerMutation.mutateAsync(localCustomer);
      setSelectedCustomer(prev => prev ? { ...prev, ...localCustomer } : null);
    } catch (err) { console.error('Failed to update customer:', err); }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (shouldBlockBasic) { openPaywall(isGuestAccount ? 'default' : 'trial_ended'); return; }
    if (!newCustomer.name?.trim() && !newCustomer.company?.trim()) { setFormError('กรุณาระบุชื่อลูกค้า หรือ ชื่อบริษัท'); return; }
    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) { setFormError('รูปแบบอีเมลไม่ถูกต้อง'); return; }
    if (createCustomerMutation.isPending) return;
    setFormError(null);
    try {
      await createCustomerMutation.mutateAsync(newCustomer);
      setIsAddModalOpen(false);
      setNewCustomer(EMPTY_FORM);
    } catch (err) { setFormError(err?.message || 'ไม่สามารถบันทึกได้'); }
  };

  const handleConvertSynthetic = async (customer) => {
    if (!customer._fromDeals) return;
    if (shouldBlockBasic) { openPaywall(isGuestAccount ? 'default' : 'trial_ended'); return; }
    try {
      await createCustomerMutation.mutateAsync({ name: customer.name, company: customer.company, email: customer.email || '', phone: customer.phone || '', industry: customer.industry || '', tier: 'Silver', notes: '' });
      setIsSidebarOpen(false); setSelectedCustomer(null);
    } catch (err) { console.error(err); }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (editingContact) updateContact(editingContact.id, contactForm);
    else addContact(contactForm);
    setIsContactFormOpen(false); setEditingContact(null);
    setContactForm({ full_name: '', role: '', email: '', phone: '', is_primary: false });
  };

  const enrichedCustomers = useMemo(() => {
    if (!customers) return [];
    return buildCustomerHealth(customers, deals || []);
  }, [customers, deals]);

  const gradeCounts = useMemo(() => {
    const counts = { all: enrichedCustomers.length, A: 0, B: 0, C: 0, D: 0 };
    enrichedCustomers.forEach(c => { if (c.grade && counts[c.grade] !== undefined) counts[c.grade]++; });
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
    if (gradeFilter.startsWith('grade-')) result = result.filter(c => c.grade === gradeFilter.replace('grade-', ''));
    else if (gradeFilter !== 'all') result = result.filter(c => c.tier === gradeFilter);
    if (industryFilter !== 'all') result = result.filter(c => c.industry === industryFilter);

    result = [...result].sort((a, b) => {
      let valA, valB;
      if (sortBy === 'clv') { valA = a.dealStats.wonValue + (a.dealStats.activeValue || 0); valB = b.dealStats.wonValue + (b.dealStats.activeValue || 0); }
      else if (sortBy === 'health') { valA = a.health?.score ?? 0; valB = b.health?.score ?? 0; }
      else if (sortBy === 'date') { valA = new Date(a.updated_at || a.created_at || 0).getTime(); valB = new Date(b.updated_at || b.created_at || 0).getTime(); }
      else { valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [enrichedCustomers, debouncedSearchTerm, gradeFilter, industryFilter, sortBy, sortOrder]);

  const totalStats = useMemo(() => ({
    total: filteredCustomers.length,
    totalWonValue: filteredCustomers.reduce((s, c) => s + c.dealStats.wonValue, 0),
    totalActiveValue: filteredCustomers.reduce((s, c) => s + c.dealStats.activeValue, 0),
    atRiskAccounts: filteredCustomers.filter(c => ['at_risk', 'watch'].includes(c.health?.status)).length,
  }), [filteredCustomers]);

  const exportToCSV = () => {
    downloadCsv(filteredCustomers.map(c => ({
      'ชื่อลูกค้า': c.name || '', 'บริษัท': c.company || '', 'อีเมล': c.email || '',
      'เบอร์โทร': c.phone || '', 'อุตสาหกรรม': c.industry || '',
      'ระดับ (Tier)': c.tier || '', 'เกรด (Grade)': c.grade || '',
      'สถานะสุขภาพ': HEALTH_BADGE[c.health?.status]?.label || '',
      'ยอดซื้อรวม': c.dealStats.wonValue || 0,
    })), `customers_${new Date().toISOString().slice(0, 10)}`);
  };

  const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`คุณต้องการลบลูกค้า ${selectedIds.length} รายการใช่หรือไม่?`)) {
      try { await Promise.all(selectedIds.map(id => deleteCustomerMutation.mutateAsync(id))); setSelectedIds([]); } catch (e) { console.error(e); }
    }
  };

  const isLoading = customersLoading || dealsLoading;

  const openCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsSidebarOpen(true);
  };

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-slate-200 rounded-2xl" />
            <div className="space-y-2 flex-1"><div className="h-3 bg-slate-200 rounded w-2/3" /><div className="h-2.5 bg-slate-100 rounded w-1/2" /></div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full" />
          <div className="grid grid-cols-3 gap-2"><div className="h-8 bg-slate-100 rounded-xl" /><div className="h-8 bg-slate-100 rounded-xl" /><div className="h-8 bg-slate-100 rounded-xl" /></div>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto pb-20 px-4 md:px-0 relative">
      {/* Ambient glows */}
      <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-400/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className={cn(
        'flex gap-6 transition-all duration-500',
        isSidebarOpen ? 'pr-0' : ''
      )}>
        {/* ── LEFT: Main content ── */}
        <div className={cn('flex-1 min-w-0 space-y-5 transition-all duration-500', isSidebarOpen && 'max-w-[calc(100%-420px)]')}>
          {/* Header */}
          <PageHeader
            icon={Users}
            title="ฐานลูกค้า"
            description="จัดการลูกค้าครบวงจร พร้อมวิเคราะห์สุขภาพบัญชีและ AI Playbook"
            rightContent={
              <div className="flex items-center gap-2">
                <Button onClick={exportToCSV} variant="outline" className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <Download size={14} /> ส่งออก
                </Button>
                <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <Upload size={14} /> นำเข้า
                </Button>
                <Button
                  onClick={() => shouldBlockBasic ? openPaywall(isGuestAccount ? 'default' : 'trial_ended') : (setNewCustomer(EMPTY_FORM), setFormError(null), setIsAddModalOpen(true))}
                  className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold border-0 shadow-md shadow-violet-500/20 flex items-center gap-1.5 hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={16} strokeWidth={3} /> เพิ่มลูกค้า
                </Button>
              </div>
            }
          />

          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'ลูกค้าทั้งหมด', val: totalStats.total, icon: Users, gradient: 'from-violet-500 to-indigo-600', shadow: 'shadow-violet-500/25' },
              { label: 'ปิดได้รวม', val: formatCurrency(totalStats.totalWonValue), icon: DollarSign, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' },
              { label: 'Pipeline ดำเนินการ', val: formatCurrency(totalStats.totalActiveValue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
              { label: 'บัญชีต้องดูแลด่วน', val: totalStats.atRiskAccounts, icon: AlertTriangle, gradient: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/25' },
            ].map(({ label, val, icon: Icon, gradient, shadow }) => (
              <div key={label} className={cn('p-5 rounded-2xl bg-gradient-to-br text-white shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-all duration-300', gradient, shadow)}>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{label}</p>
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                </div>
                <p className="relative z-10 text-2xl font-black">{val}</p>
              </div>
            ))}
          </div>

          {/* Search + Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                placeholder="ค้นหาชื่อ, บริษัท, อีเมล..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Grade filter pills */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {[
                { val: 'all', label: 'ทั้งหมด', count: gradeCounts.all, cls: 'bg-violet-600 text-white' },
                { val: 'grade-A', label: 'A', count: gradeCounts.A, cls: 'bg-emerald-600 text-white' },
                { val: 'grade-B', label: 'B', count: gradeCounts.B, cls: 'bg-blue-600 text-white' },
                { val: 'grade-C', label: 'C', count: gradeCounts.C, cls: 'bg-amber-500 text-white' },
                { val: 'grade-D', label: 'D', count: gradeCounts.D, cls: 'bg-rose-500 text-white' },
              ].map(({ val, label, count, cls }) => (
                <button key={val} onClick={() => setGradeFilter(val)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1',
                    gradeFilter === val ? cls : 'text-slate-500 hover:text-slate-800 hover:bg-white')}>
                  {label}
                  <span className={cn('text-[10px] px-1.5 rounded-full', gradeFilter === val ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500')}>{count}</span>
                </button>
              ))}
            </div>

            {/* Sort + View */}
            <div className="flex items-center gap-2">
              <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [by, ord] = e.target.value.split('-'); setSortBy(by); setSortOrder(ord); }}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 outline-none focus:border-violet-400 cursor-pointer">
                <option value="name-asc">ชื่อ A→Z</option>
                <option value="name-desc">ชื่อ Z→A</option>
                <option value="clv-desc">CLV มากสุด</option>
                <option value="clv-asc">CLV น้อยสุด</option>
                <option value="health-desc">Health ดีสุด</option>
                <option value="health-asc">Health แย่สุด</option>
                <option value="date-desc">อัปเดตล่าสุด</option>
              </select>
              <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl">
                <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-700')}>
                  <LayoutGrid size={15} />
                </button>
                <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-700')}>
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk action bar */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-2xl px-4 py-2.5">
                  <span className="text-sm font-bold text-violet-700">เลือก {selectedIds.length} รายการ</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedIds([])} className="h-8 text-xs border-violet-200 text-violet-600">ยกเลิก</Button>
                    <Button variant="outline" size="sm" onClick={handleBulkDelete} className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                      <Trash2 size={13} className="mr-1" /> ลบที่เลือก
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredCustomers.map(customer => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onOpen={openCustomer}
                    onSelect={toggleSelection}
                    isSelected={selectedIds.includes(customer.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && filteredCustomers.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="p-4 w-12">
                        <div className={cn('w-5 h-5 rounded-full border-2 cursor-pointer flex items-center justify-center', selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? 'bg-violet-600 border-violet-600' : 'border-slate-300')}
                          onClick={() => setSelectedIds(selectedIds.length === filteredCustomers.length ? [] : filteredCustomers.map(c => c.id))}>
                          {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 && <CheckCircle2 size={11} className="text-white" />}
                        </div>
                      </th>
                      {['ลูกค้า', 'เกรด / ระดับ', 'สุขภาพบัญชี', 'CLV', 'ดีล', 'ติดต่อ', ''].map(h => (
                        <th key={h} className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCustomers.map(customer => (
                      <CustomerRow key={customer.id} customer={customer} onOpen={openCustomer} onSelect={toggleSelection} isSelected={selectedIds.includes(customer.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredCustomers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                <Users size={36} className="text-violet-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                {searchTerm ? 'ไม่พบลูกค้า' : 'ยังไม่มีฐานลูกค้า'}
              </h3>
              <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">
                {searchTerm ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง' : 'เริ่มเพิ่มลูกค้าเพื่อติดตามและวิเคราะห์สุขภาพบัญชีอย่างมืออาชีพ'}
              </p>
              <button
                onClick={() => searchTerm ? setSearchTerm('') : (setNewCustomer(EMPTY_FORM), setIsAddModalOpen(true))}
                className="px-6 py-3 bg-violet-600 text-white text-sm font-bold rounded-2xl hover:bg-violet-700 hover:scale-105 transition-all shadow-lg shadow-violet-500/20"
              >
                {searchTerm ? 'ล้างการค้นหา' : '+ เพิ่มลูกค้าใหม่'}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Detail Side Panel ── */}
        <AnimatePresence>
          {isSidebarOpen && selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, x: 40, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 400 }}
              exit={{ opacity: 0, x: 40, width: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 bg-white rounded-3xl border border-slate-100 shadow-[0_0_40px_rgba(0,0,0,0.08)] overflow-hidden sticky top-4 h-[calc(100vh-6rem)]"
            >
              <CustomerDetailPanel
                customer={selectedCustomer}
                onClose={() => { setIsSidebarOpen(false); setSelectedCustomer(null); }}
                contacts={contacts}
                isContactFormOpen={isContactFormOpen}
                setIsContactFormOpen={setIsContactFormOpen}
                editingContact={editingContact}
                setEditingContact={setEditingContact}
                contactForm={contactForm}
                setContactForm={setContactForm}
                handleContactSubmit={handleContactSubmit}
                deleteContact={deleteContact}
                localCustomer={localCustomer}
                setLocalCustomer={setLocalCustomer}
                handleSaveCustomer={handleSaveCustomer}
                updateCustomerMutation={updateCustomerMutation}
                createCustomerMutation={createCustomerMutation}
                deleteCustomerMutation={deleteCustomerMutation}
                handleConvertSynthetic={handleConvertSynthetic}
                setConfirmDelete={setConfirmDelete}
                setPendingNewDealCustomer={setPendingNewDealCustomer}
                navigate={navigate}
                setIsSidebarOpen={setIsSidebarOpen}
                shouldBlockBasic={shouldBlockBasic}
                openPaywall={openPaywall}
                isGuestAccount={isGuestAccount}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSV Import */}
      <CustomerCSVImport open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImportSuccess={() => {}} />

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-3xl p-0 border border-slate-100 shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
          <div className="p-7 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <Users size={22} className="text-violet-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-slate-900">เพิ่มลูกค้าใหม่</DialogTitle>
                  <p className="text-sm text-slate-500 mt-0.5">กรอกข้อมูลลูกค้าเพื่อเพิ่มเข้าระบบ</p>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ชื่อลูกค้า *</label>
                  <Input required placeholder="เช่น คุณสมชาย ใจดี" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="h-11 rounded-xl text-sm font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">บริษัท</label>
                  <Input placeholder="บริษัท ABC จำกัด" value={newCustomer.company} onChange={e => setNewCustomer({ ...newCustomer, company: e.target.value })} className="h-11 rounded-xl text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">อุตสาหกรรม</label>
                  <Input placeholder="IT, Manufacturing..." value={newCustomer.industry} onChange={e => setNewCustomer({ ...newCustomer, industry: e.target.value })} className="h-11 rounded-xl text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">อีเมล</label>
                  <Input type="email" placeholder="example@company.com" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className="h-11 rounded-xl text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เบอร์โทร</label>
                  <Input placeholder="0XX-XXX-XXXX" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="h-11 rounded-xl text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ระดับลูกค้า</label>
                  <select value={newCustomer.tier} onChange={e => setNewCustomer({ ...newCustomer, tier: e.target.value })} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 cursor-pointer">
                    <option value="Silver">🥈 Silver</option>
                    <option value="Gold">🥇 Gold</option>
                    <option value="Platinum">💎 Platinum</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">บันทึกเพิ่มเติม</label>
                  <Textarea placeholder="บันทึกข้อมูลเพิ่มเติม..." value={newCustomer.notes} onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })} className="rounded-xl resize-none min-h-[80px] text-sm" />
                </div>
              </div>
              {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600 font-semibold">{formError}</div>}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="flex-1 h-11 rounded-xl text-slate-500 hover:bg-slate-100" disabled={createCustomerMutation.isPending}>ยกเลิก</Button>
                <Button type="submit" className="flex-[2] h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold border-0 shadow-md" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? <><Loader2 size={16} className="animate-spin mr-2" />กำลังบันทึก...</> : 'บันทึกลูกค้า'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={open => setConfirmDelete({ open, customerId: open ? confirmDelete.customerId : null })}
        title="ลบลูกค้า"
        description="การดำเนินการนี้จะลบลูกค้าถาวร ดีลที่เชื่อมโยงจะถูกเก็บไว้"
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
