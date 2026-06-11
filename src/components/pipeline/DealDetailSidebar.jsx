import { useState, useEffect, useCallback } from 'react';
import { STAGES } from '../../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, CheckCircle2, XCircle,
  Phone, Mail, FileText, Clock,
  Sparkles, Activity, Target, ShieldCheck, Zap,
  Loader2, Send, CalendarClock, ListTodo, AlertTriangle, Settings,
  Building2, User, DollarSign, TrendingUp, X, ChevronRight
} from 'lucide-react';
import WinLossModal from './WinLossModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { cn } from '../../lib/utils';
import { formatFullCurrency as formatCurrency } from '../../lib/formatters';
import { callGeminiAPI } from '../../services/ai';
import { useDealActivities, useAddActivity } from '../../hooks/useActivities';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { createPortal } from 'react-dom';

const STAGE_WORKFLOW = {
  lead: {
    label: 'ลูกค้าใหม่', color: 'bg-slate-50 border-slate-200', headerColor: 'text-slate-700',
    dot: 'bg-slate-400',
    steps: [
      { text: 'ติดต่อลูกค้าเพื่อแนะนำตัวและสอบถามความต้องการ', key: 'contact' },
      { text: 'ประเมิน Pain Point และ Budget เบื้องต้น', key: 'qualify' },
      { text: 'นัดประชุมหรือ Demo สินค้า', key: 'meeting' },
      { text: 'อัพเดท Next Step พร้อมวันที่', key: 'nextstep' },
    ],
    reminder: null,
  },
  contact: {
    label: 'นัดเจอ', color: 'bg-amber-50/50 border-amber-100', headerColor: 'text-amber-700',
    dot: 'bg-amber-500',
    steps: [
      { text: 'นำเสนอโซลูชันที่ตรงกับความต้องการ', key: 'present' },
      { text: 'ประเมินงบประมาณและผู้มีอำนาจตัดสินใจ', key: 'budget' },
      { text: 'ส่งข้อมูลผลิตภัณฑ์หรือ Case Study', key: 'info' },
      { text: 'นัดประชุมติดตามผลเพื่อเสนอราคา', key: 'followup' },
    ],
    reminder: null,
  },
  proposal: {
    label: 'เสนอราคา', color: 'bg-sky-50/50 border-sky-200', headerColor: 'text-sky-700',
    dot: 'bg-sky-500',
    steps: [
      { text: 'ส่งใบเสนอราคาครบถ้วนพร้อม spec', key: 'send' },
      { text: '⏰ 3 วัน — โทรติดตาม ถามว่ามีข้อสงสัยไหม', key: 'day3' },
      { text: '⏰ 5 วัน — เสนอ option เพิ่มเติม / ราคาพิเศษ', key: 'day5' },
      { text: '⏰ 7 วัน — ขอนัดประชุม ตีกลับ ก่อนหลุด!', key: 'day7' },
      { text: 'แก้ไขข้อกังวลและส่งใบเสนอราคาฉบับสุดท้าย', key: 'revise' },
    ],
    reminder: '⚠️ Proposal เกิน 7 วันไม่มีตอบรับ = เสี่ยงหลุดสูงมาก ต้องโทรจิกทันที',
  },
  negotiation: {
    label: 'กำลังปิด', color: 'bg-violet-50/50 border-violet-200', headerColor: 'text-violet-700',
    dot: 'bg-violet-500',
    steps: [
      { text: 'ยืนยันเงื่อนไขและราคาสุดท้ายกับผู้มีอำนาจ', key: 'confirm' },
      { text: 'ส่ง PO / Contract ให้ลูกค้าเซ็น', key: 'contract' },
      { text: '⏰ 3 วัน — ติดตามสถานะ PO / อนุมัติ', key: 'day3' },
      { text: '⏰ 5 วัน — ยกระดับ ติดต่อผู้บริหารโดยตรง', key: 'day5' },
      { text: 'ยืนยันวันส่งมอบและ milestone การชำระเงิน', key: 'delivery' },
    ],
    reminder: '🔥 ดีลในขั้น Negotiation ต้องปิดให้ได้ใน 14 วัน หากยาวกว่านั้นให้ escalate',
  },
  won: {
    label: 'ปิดได้', color: 'bg-emerald-50/50 border-emerald-200', headerColor: 'text-emerald-700',
    dot: 'bg-emerald-500',
    steps: [
      { text: 'ส่งใบแจ้งหนี้ (Invoice) และยืนยันการสั่งซื้อ', key: 'invoice' },
      { text: 'ติดตามการชำระเงินตามกำหนด', key: 'payment' },
      { text: 'ดูแลการส่งมอบสินค้า/บริการให้ครบ', key: 'delivery' },
      { text: 'ขอ Testimonial / Review จากลูกค้า', key: 'review' },
      { text: 'วางแผน Upsell / Renewal ครั้งถัดไป', key: 'upsell' },
    ],
    reminder: null,
  },
  lost: {
    label: 'ปิดไม่ได้', color: 'bg-rose-50/50 border-rose-100', headerColor: 'text-rose-700',
    dot: 'bg-rose-500',
    steps: [
      { text: 'บันทึกเหตุผลการแพ้อย่างละเอียด', key: 'reason' },
      { text: 'วิเคราะห์จุดอ่อน เช่น ราคา, คู่แข่ง, ความล่าช้า', key: 'analyze' },
      { text: 'ติดต่อลูกค้าเพื่อขอ feedback', key: 'feedback' },
      { text: 'ตั้ง Reminder ติดต่อใหม่ใน 3-6 เดือน', key: 'recontact' },
    ],
    reminder: null,
  },
};

const STAGE_BADGE = {
  lead:        { label: 'ลูกค้าใหม่',  cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  contact:     { label: 'นัดเจอ',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  proposal:    { label: 'เสนอราคา',   cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  negotiation: { label: 'กำลังปิด',   cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  won:         { label: '🎉 ปิดได้',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lost:        { label: 'ปิดไม่ได้',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const ACTIVITY_TYPES = [
  { id: 'call',    label: 'โทรหา',     icon: Phone,         color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'email',   label: 'อีเมล',     icon: Mail,          color: 'bg-violet-50 text-violet-600 border-violet-200' },
  { id: 'meeting', label: 'ประชุม',    icon: Clock,         color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'note',    label: 'บันทึก',    icon: FileText,      color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { id: 'task',    label: 'นัดติดตาม', icon: CalendarClock, color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

const todayLocalISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const TABS = [
  { id: 'overview',    label: 'ภาพรวม',     icon: Target },
  { id: 'activities',  label: 'กิจกรรม',    icon: Activity },
  { id: 'playbook',    label: 'Checklist',  icon: ListTodo },
  { id: 'ai',          label: 'AI',          icon: Sparkles },
  { id: 'edit',        label: 'แก้ไข',      icon: Settings },
];

export default function DealDetailSidebar({ isOpen, deal, onUpdate, onDelete, onClose, onRequestDelete, onRequestCloseStage }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [activeType, setActiveType] = useState('call');
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [showEmailTemplatesPanel, setShowEmailTemplatesPanel] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const { data: emailTemplates = [] } = useEmailTemplates();

  const [localEdit, setLocalEdit] = useState({
    title: '', company: '', value: '', probability: '', stage: 'lead',
    contact: '', contact_email: '', contact_phone: '', expected_close_date: '',
    actual_close_date: '',
  });

  const setField = (field, value) => setLocalEdit(p => ({ ...p, [field]: value }));
  const saveField = (field, raw) => {
    const value = field === 'value' || field === 'probability' ? Number(raw) : raw;
    if (deal[field] != value) onUpdate(deal.id, { [field]: value });
  };

  const { data: activities = [], isLoading: activitiesLoading } = useDealActivities(deal?.id);
  const addActivityMutation = useAddActivity();

  const parseAIResponse = (text) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { return null; }
  };

  const handleAIAnalysis = useCallback(async () => {
    if (!deal) return;
    setIsAnalyzing(true);
    const prompt = `Analyze this sales deal and provide a high-impact strategy.
    Deal: ${deal.title} at ${deal.company}
    Value: ${formatCurrency(deal.value)}
    Stage: ${deal.stage}
    Probability: ${deal.probability}%

    Return ONLY a JSON object:
    {
      "strategy": "3 bullet points of tactical advice in Thai",
      "risk_level": "low|medium|high",
      "next_step": "One clear action item in Thai",
      "win_likelihood": "0-100 percentage"
    }`;

    const result = await callGeminiAPI(prompt);
    if (result) {
      const parsed = parseAIResponse(result);
      if (parsed) setAiAnalysis(parsed);
    }
    setIsAnalyzing(false);
  }, [deal]);

  useEffect(() => {
    if (deal && deal.value >= 1000000 && !aiAnalysis) handleAIAnalysis();
  }, [deal, aiAnalysis, handleAIAnalysis]);

  useEffect(() => {
    setActiveTab('overview');
    setNoteText(''); setFollowUpDate(''); setFollowUpNote('');
    setAiAnalysis(null); setShowEmailTemplatesPanel(false);
    setSelectedTemplateId(''); setCopiedTemplate(false);
    if (deal) {
      setLocalEdit({
        title: deal.title || '',
        company: deal.company || '',
        value: deal.value ?? '',
        probability: deal.probability ?? '',
        stage: deal.stage || 'lead',
        contact: deal.contact || '',
        contact_email: deal.contact_email || '',
        contact_phone: deal.contact_phone || '',
        expected_close_date: deal.expected_close_date ? deal.expected_close_date.slice(0, 10) : '',
        actual_close_date: deal.actual_close_date ? deal.actual_close_date.slice(0, 10) : '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  const handleScheduleFollowUp = async () => {
    if (!deal || !followUpDate) return;
    const scheduledAt = new Date(`${followUpDate}T09:00:00`).toISOString();
    await addActivityMutation.mutateAsync({
      deal_id: deal.id, type: 'task',
      title: followUpNote.trim() || `ติดตามดีล: ${deal.title}`,
      description: followUpNote.trim() || null,
      scheduled_at: scheduledAt,
    });
    setFollowUpDate(''); setFollowUpNote('');
  };

  const handleLogActivity = async () => {
    if (!deal) return;
    const typeConfig = ACTIVITY_TYPES.find(t => t.id === activeType);
    const title = noteText.trim() ? `${typeConfig.label}: ${noteText.trim()}` : typeConfig.label;
    await addActivityMutation.mutateAsync({
      deal_id: deal.id, type: activeType, title,
      description: noteText.trim() || null,
      completed_at: new Date().toISOString(),
    });
    setNoteText('');
    onUpdate(deal.id, { last_activity: new Date().toISOString() });
  };

  if (!deal) return null;

  const stageBadge = STAGE_BADGE[deal.stage] || STAGE_BADGE.lead;
  const wf = STAGE_WORKFLOW[deal.stage];

  return createPortal(
    <AnimatePresence>
      {isOpen && deal && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="relative z-10 w-full max-w-xl h-dvh bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* ─── HEADER ─── */}
            <div className={cn(
              'shrink-0 px-6 pt-6 pb-5 border-b border-slate-100',
              deal.stage === 'won' ? 'bg-gradient-to-br from-emerald-50 to-teal-50' :
              deal.stage === 'lost' ? 'bg-gradient-to-br from-rose-50 to-pink-50' :
              'bg-white'
            )}>
              {/* Top bar */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0', stageBadge.cls)}>
                    {stageBadge.label}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Deal name + company */}
              <div className="space-y-1 mb-4">
                <h2 className="text-xl font-black text-slate-900 leading-tight line-clamp-2">{deal.title}</h2>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <Building2 size={13} />
                  <span>{deal.company || '—'}</span>
                  {deal.contact && (
                    <>
                      <span className="text-slate-300">•</span>
                      <User size={13} />
                      <span>{deal.contact}</span>
                    </>
                  )}
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                {/* Value */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">มูลค่า</p>
                  <p className="text-base font-black text-slate-900 tabular-nums leading-tight">{formatCurrency(deal.value)}</p>
                </div>
                {/* Probability */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">โอกาส</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-black text-slate-900 tabular-nums">{deal.probability}%</p>
                  </div>
                  <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${deal.probability}%` }}
                      className={cn('h-full rounded-full',
                        deal.probability >= 70 ? 'bg-emerald-500' :
                        deal.probability >= 40 ? 'bg-violet-500' : 'bg-amber-500'
                      )}
                    />
                  </div>
                </div>
                {/* Stage position */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ขั้นตอน</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', wf?.dot || 'bg-slate-400')} />
                    <p className="text-xs font-bold text-slate-700 truncate">{stageBadge.label.replace('🎉 ', '')}</p>
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                  onClick={() => onRequestCloseStage?.('won')}
                  disabled={deal.stage === 'won'}
                >
                  <CheckCircle2 size={14} /> ปิดได้!
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1.5"
                  onClick={() => onRequestCloseStage?.('lost')}
                  disabled={deal.stage === 'lost'}
                >
                  <XCircle size={14} /> ปิดไม่ได้
                </Button>
                <button
                  onClick={() => onRequestDelete?.(deal.id)}
                  className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* ─── TAB BAR ─── */}
            <div className="shrink-0 flex border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all',
                      isActive
                        ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ─── CONTENT ─── */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-5">
                    {/* Contact actions */}
                    {(deal.contact_email || deal.contact_phone) && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ติดต่อลูกค้า</p>
                        <div className="grid grid-cols-2 gap-2">
                          {deal.contact_phone && (
                            <a
                              href={`tel:${deal.contact_phone}`}
                              onClick={() => addActivityMutation.mutate({ deal_id: deal.id, type: 'call', title: `โทรหา ${deal.contact || deal.contact_phone}`, completed_at: new Date().toISOString() })}
                              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors border border-blue-100"
                            >
                              <Phone size={14} /> {deal.contact_phone}
                            </a>
                          )}
                          {deal.contact_email && (
                            <button
                              type="button"
                              onClick={() => setShowEmailTemplatesPanel(v => !v)}
                              className={cn(
                                'flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all border',
                                showEmailTemplatesPanel
                                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                                  : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-100'
                              )}
                            >
                              <Mail size={14} /> ส่งอีเมล
                            </button>
                          )}
                        </div>

                        {/* Email template panel */}
                        <AnimatePresence>
                          {showEmailTemplatesPanel && deal.contact_email && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-violet-50/40 border border-violet-100 rounded-2xl p-4 space-y-3 overflow-hidden"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-wider text-violet-700">ส่งอีเมลด้วย Template</h4>
                                <button onClick={() => { setShowEmailTemplatesPanel(false); setSelectedTemplateId(''); }} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">ปิด</button>
                              </div>
                              <select
                                value={selectedTemplateId}
                                onChange={e => setSelectedTemplateId(e.target.value)}
                                className="w-full h-10 rounded-xl bg-white border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-violet-400"
                              >
                                <option value="">— เลือกเทมเพลต —</option>
                                {emailTemplates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name} ({t.category || 'อื่นๆ'})</option>
                                ))}
                              </select>

                              {selectedTemplateId && (() => {
                                const template = emailTemplates.find(t => t.id === selectedTemplateId);
                                if (!template) return null;
                                const fmt = (text) => !text ? '' : text
                                  .replace(/\{\{name\}\}/g, deal.contact || 'ลูกค้า')
                                  .replace(/\{\{company\}\}/g, deal.company || 'บริษัท')
                                  .replace(/\{\{value\}\}/g, new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(deal.value) || 0));
                                const subject = fmt(template.subject || deal.title || 'ติดต่อผู้ประสานงาน');
                                const body = fmt(template.body || '');
                                return (
                                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Subject: <span className="text-slate-800 normal-case font-bold text-xs">{subject}</span></p>
                                    <pre className="text-xs text-slate-600 font-sans whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto bg-slate-50 p-2.5 rounded-lg border border-slate-100">{body}</pre>
                                    <div className="flex gap-2">
                                      <button onClick={() => { navigator.clipboard.writeText(body); setCopiedTemplate(true); setTimeout(() => setCopiedTemplate(false), 2000); addActivityMutation.mutate({ deal_id: deal.id, type: 'note', title: `คัดลอกอีเมล: ${template.name}`, completed_at: new Date().toISOString() }); }}
                                        className="flex-1 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                                        {copiedTemplate ? <CheckCircle2 size={13} className="text-emerald-600" /> : <FileText size={13} />}
                                        {copiedTemplate ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                                      </button>
                                      <button onClick={() => { window.open(`mailto:${deal.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank'); onUpdate(deal.id, { last_activity: new Date().toISOString() }); }}
                                        className="flex-1 h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                                        <Send size={13} /> เปิดแอปเมล
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Schedule follow-up */}
                    <div className="rounded-2xl bg-amber-50/60 border border-amber-100 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarClock size={14} className="text-amber-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-amber-700">นัดติดตามครั้งถัดไป</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date" min={todayLocalISO()} value={followUpDate}
                          onChange={e => setFollowUpDate(e.target.value)}
                          className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold focus:border-amber-400 outline-none"
                        />
                        <Input
                          placeholder="หัวข้อนัด..." value={followUpNote}
                          onChange={e => setFollowUpNote(e.target.value)}
                          className="h-10 rounded-xl bg-white border-slate-200 text-sm"
                        />
                      </div>
                      <Button
                        onClick={handleScheduleFollowUp}
                        disabled={!followUpDate || addActivityMutation.isPending}
                        className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold border-0 shadow-sm disabled:opacity-50"
                      >
                        <ListTodo size={13} className="mr-1.5" /> สร้างนัดติดตาม
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── ACTIVITIES TAB ── */}
                {activeTab === 'activities' && (
                  <motion.div key="activities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-6">
                    {/* Log activity box */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity size={13} className="text-violet-600" />
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">บันทึกกิจกรรม</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {ACTIVITY_TYPES.filter(t => t.id !== 'task').map(t => {
                          const Icon = t.icon;
                          return (
                            <button key={t.id} type="button" onClick={() => setActiveType(t.id)}
                              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                activeType === t.id ? t.color : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              )}>
                              <Icon size={12} /> {t.label}
                            </button>
                          );
                        })}
                      </div>
                      <Textarea
                        placeholder="บันทึกรายละเอียด..."
                        value={noteText} onChange={e => setNoteText(e.target.value)}
                        className="rounded-xl bg-white border-slate-200 resize-none min-h-[80px] text-sm focus:border-violet-400"
                      />
                      <Button
                        onClick={handleLogActivity} disabled={addActivityMutation.isPending}
                        className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 border-0 shadow-md shadow-violet-500/20"
                      >
                        {addActivityMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        บันทึก Activity
                      </Button>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ประวัติ ({activities.length})
                      </p>
                      {activitiesLoading ? (
                        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-300" /></div>
                      ) : activities.length === 0 ? (
                        <div className="text-center py-10 text-slate-300">
                          <Activity size={32} className="mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-medium text-slate-400">ยังไม่มีประวัติกิจกรรม</p>
                        </div>
                      ) : (
                        <div className="relative space-y-3 pl-8">
                          <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100" />
                          {activities.map((act, i) => {
                            const typeConfig = ACTIVITY_TYPES.find(t => t.id === act.type) || ACTIVITY_TYPES[3];
                            const Icon = typeConfig.icon;
                            return (
                              <motion.div key={act.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.2) }} className="relative">
                                <div className={cn('absolute -left-5 w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10 bg-white', typeConfig.color)}>
                                  <Icon size={12} />
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-800 leading-tight">{act.title}</p>
                                    {act.scheduled_at && !act.completed_at && (
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">รอดำเนินการ</span>
                                    )}
                                  </div>
                                  {act.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{act.description}</p>}
                                  <p className="text-[10px] text-slate-400 mt-1.5">
                                    {act.scheduled_at && !act.completed_at
                                      ? `นัด ${new Date(act.scheduled_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
                                      : timeAgo(act.created_at)}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── PLAYBOOK TAB ── */}
                {activeTab === 'playbook' && (
                  <motion.div key="playbook" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-5">
                    {wf && (
                      <div className={cn('space-y-4 p-5 rounded-2xl border', wf.color)}>
                        <div className="flex items-center gap-2">
                          <ListTodo size={14} className={wf.headerColor} />
                          <h3 className={cn('text-[11px] font-black uppercase tracking-widest', wf.headerColor)}>
                            ขั้นตอน: {wf.label}
                          </h3>
                        </div>
                        <ul className="space-y-3">
                          {wf.steps.map((step, i) => (
                            <li key={step.key} className="flex items-start gap-3 text-sm">
                              <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-0.5 shadow-sm">{i + 1}</span>
                              <span className="text-slate-700 leading-relaxed font-medium">{step.text}</span>
                            </li>
                          ))}
                        </ul>
                        {wf.reminder && (
                          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-white/80 border border-rose-200">
                            <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold text-rose-700 leading-relaxed">{wf.reminder}</p>
                          </div>
                        )}
                        {['proposal', 'negotiation'].includes(deal.stage) && (() => {
                          const days = Math.floor((Date.now() - new Date(deal.last_activity || deal.created_at).getTime()) / 86_400_000);
                          if (days < 3) return null;
                          const cls = days >= 7 ? 'bg-rose-600 text-white' : days >= 5 ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white';
                          return (
                            <div className={cn('px-3 py-2.5 rounded-xl text-xs font-bold text-center shadow-sm', cls)}>
                              {days >= 7 ? '🔴' : days >= 5 ? '🟠' : '🟡'} ดีลหยุดนิ่งมา {days} วันแล้ว! {days >= 7 ? 'ต้องรีบตามด่วน' : 'ควรติดต่อด่วน'}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── AI TAB ── */}
                {activeTab === 'ai' && (
                  <motion.div key="ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-4">
                    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-violet-800">AI Sales Strategy</h3>
                            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Powered by Gemini</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleAIAnalysis} disabled={isAnalyzing}
                          className="text-xs font-bold text-violet-600 hover:bg-violet-100 rounded-xl px-3">
                          {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : 'วิเคราะห์ใหม่'}
                        </Button>
                      </div>

                      <AnimatePresence mode="wait">
                        {isAnalyzing ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">กำลังวิเคราะห์...</p>
                          </motion.div>
                        ) : aiAnalysis ? (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white rounded-xl p-4 border border-violet-100 shadow-sm text-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Win Likelihood</p>
                                <span className="text-3xl font-black text-slate-900">{aiAnalysis.win_likelihood}%</span>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-violet-100 shadow-sm text-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ความเสี่ยง</p>
                                <span className={cn('text-sm font-black', aiAnalysis.risk_level === 'high' ? 'text-rose-600' : aiAnalysis.risk_level === 'medium' ? 'text-amber-600' : 'text-emerald-600')}>
                                  {aiAnalysis.risk_level === 'high' ? '🔴 สูง' : aiAnalysis.risk_level === 'medium' ? '🟡 ปานกลาง' : '🟢 ต่ำ'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-violet-100 shadow-sm space-y-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">กลยุทธ์แนะนำ</p>
                              <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">{aiAnalysis.strategy}</p>
                            </div>
                            <div className="bg-violet-600 rounded-xl p-4 text-white shadow-lg shadow-violet-500/20">
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-1">Next Step สำคัญ</p>
                              <p className="text-sm font-bold">{aiAnalysis.next_step}</p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="py-10 text-center">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                              <Zap size={24} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">กดปุ่ม "วิเคราะห์ใหม่" เพื่อให้ AI ประเมินโอกาสปิดดีล</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* ── EDIT TAB ── */}
                {activeTab === 'edit' && (
                  <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6 space-y-6">
                    {/* Deal info */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp size={11} /> ข้อมูลดีล
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชื่อดีล</label>
                          <Input value={localEdit.title} onChange={e => setField('title', e.target.value)} onBlur={() => saveField('title', localEdit.title)}
                            className="rounded-xl h-11 bg-white border-slate-200 font-bold focus:border-violet-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชื่อบริษัท</label>
                          <Input value={localEdit.company} onChange={e => setField('company', e.target.value)} onBlur={() => saveField('company', localEdit.company)}
                            className="rounded-xl h-11 bg-white border-slate-200 font-bold focus:border-violet-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">มูลค่า (บาท)</label>
                            <Input type="number" value={localEdit.value} onChange={e => setField('value', e.target.value)} onBlur={() => saveField('value', localEdit.value)}
                              className="rounded-xl h-11 bg-white border-slate-200 font-bold focus:border-violet-400 text-violet-700" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">โอกาส (%)</label>
                            <Input type="number" min="0" max="100" value={localEdit.probability} onChange={e => setField('probability', e.target.value)} onBlur={() => saveField('probability', localEdit.probability)}
                              className="rounded-xl h-11 bg-white border-slate-200 font-bold focus:border-violet-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">วันคาดว่าจะปิด</label>
                            <input type="date" value={localEdit.expected_close_date} onChange={e => setField('expected_close_date', e.target.value)} onBlur={() => saveField('expected_close_date', localEdit.expected_close_date || null)}
                              className="w-full h-11 rounded-xl bg-white border border-slate-200 px-3 outline-none text-sm font-bold text-slate-800 focus:border-violet-400 transition-all" />
                          </div>
                          {['won', 'lost'].includes(deal.stage) && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">วันปิดจริง</label>
                              <input type="date" value={localEdit.actual_close_date || ''} onChange={e => setField('actual_close_date', e.target.value)} onBlur={() => saveField('actual_close_date', localEdit.actual_close_date ? new Date(localEdit.actual_close_date + 'T12:00:00').toISOString() : null)}
                                className="w-full h-11 rounded-xl bg-white border border-slate-200 px-3 outline-none text-sm font-bold text-slate-800 focus:border-violet-400 transition-all" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ขั้นตอนการขาย</label>
                          <select
                            value={localEdit.stage}
                            onChange={e => {
                              const s = e.target.value;
                              if (s === 'won' || s === 'lost') { onRequestCloseStage?.(s); }
                              else { setField('stage', s); onUpdate(deal.id, { stage: s }); }
                            }}
                            disabled={deal.stage === 'won' || deal.stage === 'lost'}
                            className="w-full h-11 rounded-xl bg-white border border-slate-200 px-3 font-semibold outline-none text-sm focus:border-violet-400 transition-all disabled:opacity-50"
                          >
                            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <User size={11} /> ข้อมูลผู้ติดต่อ
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชื่อผู้ติดต่อ</label>
                          <Input placeholder="ชื่อผู้ติดต่อ" value={localEdit.contact} onChange={e => setField('contact', e.target.value)} onBlur={() => saveField('contact', localEdit.contact)}
                            className="rounded-xl h-11 bg-white border-slate-200 focus:border-violet-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">เบอร์โทร</label>
                            <Input placeholder="0XX-XXX-XXXX" value={localEdit.contact_phone} onChange={e => setField('contact_phone', e.target.value)} onBlur={() => saveField('contact_phone', localEdit.contact_phone)}
                              className="rounded-xl h-11 bg-white border-slate-200 focus:border-violet-400" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">อีเมล</label>
                            <Input placeholder="email@company.com" value={localEdit.contact_email} onChange={e => setField('contact_email', e.target.value)} onBlur={() => saveField('contact_email', localEdit.contact_email)}
                              className="rounded-xl h-11 bg-white border-slate-200 focus:border-violet-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
