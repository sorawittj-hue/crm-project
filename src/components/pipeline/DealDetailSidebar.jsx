import { useState, useEffect, useCallback } from 'react';
import { STAGES } from '../../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, CheckCircle2, XCircle,
  Phone, Mail, FileText, Clock,
  Sparkles, Activity, Target, ShieldCheck, Zap,
  Loader2, Send, CalendarClock, ListTodo, AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { cn } from '../../lib/utils';
import { formatFullCurrency as formatCurrency } from '../../lib/formatters';
import { callGeminiAPI } from '../../services/ai';
import { Card, CardContent } from '../ui/Card';
import { useDealActivities, useAddActivity } from '../../hooks/useActivities';

const STAGE_WORKFLOW = {
  lead: {
    label: 'ลูกค้าใหม่',
    color: 'bg-slate-50 border-slate-200',
    headerColor: 'text-slate-700',
    steps: [
      { text: 'ติดต่อลูกค้าเพื่อแนะนำตัวและสอบถามความต้องการ', key: 'contact' },
      { text: 'ประเมิน Pain Point และ Budget เบื้องต้น', key: 'qualify' },
      { text: 'นัดประชุมหรือ Demo สินค้า', key: 'meeting' },
      { text: 'อัพเดท Next Step พร้อมวันที่', key: 'nextstep' },
    ],
    reminder: null,
  },
  contact: {
    label: 'นัดเจอ',
    color: 'bg-amber-50/50 border-amber-100',
    headerColor: 'text-amber-700',
    steps: [
      { text: 'นำเสนอโซลูชันที่ตรงกับความต้องการ', key: 'present' },
      { text: 'ประเมินงบประมาณและผู้มีอำนาจตัดสินใจ', key: 'budget' },
      { text: 'ส่งข้อมูลผลิตภัณฑ์หรือ Case Study', key: 'info' },
      { text: 'นัดประชุมติดตามผลเพื่อเสนอราคา', key: 'followup' },
    ],
    reminder: null,
  },
  proposal: {
    label: 'เสนอราคา',
    color: 'bg-sky-50/50 border-sky-200',
    headerColor: 'text-sky-700',
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
    label: 'กำลังปิด',
    color: 'bg-violet-50/50 border-violet-200',
    headerColor: 'text-violet-700',
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
    label: 'ปิดได้',
    color: 'bg-emerald-50/50 border-emerald-200',
    headerColor: 'text-emerald-700',
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
    label: 'ปิดไม่ได้',
    color: 'bg-rose-50/50 border-rose-100',
    headerColor: 'text-rose-700',
    steps: [
      { text: 'บันทึกเหตุผลการแพ้อย่างละเอียด', key: 'reason' },
      { text: 'วิเคราะห์จุดอ่อน เช่น ราคา, คู่แข่ง, ความล่าช้า', key: 'analyze' },
      { text: 'ติดต่อลูกค้าเพื่อขอ feedback', key: 'feedback' },
      { text: 'ตั้ง Reminder ติดต่อใหม่ใน 3-6 เดือน', key: 'recontact' },
    ],
    reminder: null,
  },
};

const ACTIVITY_TYPES = [
  { id: 'call',    label: 'โทรหา',    icon: Phone,        color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'email',   label: 'อีเมล',    icon: Mail,         color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { id: 'meeting', label: 'ประชุม',   icon: Clock,        color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'note',    label: 'บันทึก',   icon: FileText,     color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { id: 'task',    label: 'นัดติดตาม', icon: CalendarClock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

// Local YYYY-MM-DD for <input type="date">
const todayLocalISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export default function DealDetailSidebar({ deal, onUpdate, onDelete, onClose }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeType, setActiveType] = useState('call');
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  // Win / Loss reason modal
  const [closeModal, setCloseModal] = useState({ open: false, targetStage: null });
  const [reasonText, setReasonText] = useState('');

  // Local controlled state for deal edit fields — syncs on deal.id change
  const [localEdit, setLocalEdit] = useState({
    title: '', company: '', value: '', probability: '', stage: 'lead',
    contact: '', contact_email: '', contact_phone: '', expected_close_date: '',
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
    } catch {
      return null;
    }
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
    if (deal && deal.value >= 1000000 && !aiAnalysis) {
      handleAIAnalysis();
    }
  }, [deal, aiAnalysis, handleAIAnalysis]);

  // Reset inputs and sync local edit state when deal changes
  useEffect(() => {
    setNoteText('');
    setFollowUpDate('');
    setFollowUpNote('');
    setAiAnalysis(null);
    setCloseModal({ open: false, targetStage: null });
    setReasonText('');
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
      });
    }
  }, [deal?.id]);

  const openCloseModal = (targetStage) => {
    setReasonText('');
    setCloseModal({ open: true, targetStage });
  };

  const submitClose = () => {
    const reason = reasonText.trim();
    if (reason.length < 5) {
      // inline validation — just shake/warn without toast dependency issue
      return;
    }
    const isWon = closeModal.targetStage === 'won';
    onUpdate(deal.id, {
      stage: closeModal.targetStage,
      last_activity: new Date().toISOString(),
      actual_close_date: new Date().toISOString(),
      lost_reason: isWon ? null : reason,
      metadata: {
        ...(deal?.metadata || {}),
        close_reason: reason,
        ...(isWon ? { win_reason: reason } : {}),
        closed_at: new Date().toISOString(),
      },
    });
    setCloseModal({ open: false, targetStage: null });
    onClose?.();
  };

  const handleScheduleFollowUp = async () => {
    if (!deal || !followUpDate) return;
    const scheduledAt = new Date(`${followUpDate}T09:00:00`).toISOString();
    await addActivityMutation.mutateAsync({
      deal_id: deal.id,
      type: 'task',
      title: followUpNote.trim() || `ติดตามดีล: ${deal.title}`,
      description: followUpNote.trim() || null,
      scheduled_at: scheduledAt,
    });
    setFollowUpDate('');
    setFollowUpNote('');
  };

  const handleLogActivity = async () => {
    if (!deal) return;
    const typeConfig = ACTIVITY_TYPES.find(t => t.id === activeType);
    const title = noteText.trim()
      ? `${typeConfig.label}: ${noteText.trim()}`
      : typeConfig.label;

    await addActivityMutation.mutateAsync({
      deal_id: deal.id,
      type: activeType,
      title,
      description: noteText.trim() || null,
      completed_at: new Date().toISOString(),
    });

    setNoteText('');
    // Also update last_activity on the deal
    onUpdate(deal.id, { last_activity: new Date().toISOString() });
  };

  if (!deal) return null;

  return (
    <>
      <SheetContent className="bg-white border-l border-slate-200 w-full sm:max-w-xl p-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 space-y-8 pb-24">
          <SheetHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full" />
              <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">
                รายละเอียดดีล
              </SheetTitle>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-primary" />
              <span>ID: {deal.id.slice(0, 8)} • System Verified</span>
            </div>
          </SheetHeader>

          {/* Value / Confidence */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-[2rem] bg-slate-50 border-none">
              <CardContent className="p-5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">มูลค่าดีล</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums">{formatCurrency(deal.value)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] bg-slate-50 border-none">
              <CardContent className="p-5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ความมั่นใจ</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{deal.probability}%</p>
                  <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${deal.probability}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              className="flex-1 rounded-full h-12 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700 border-0"
              onClick={() => openCloseModal('won')}
              disabled={deal.stage === 'won'}
            >
              <CheckCircle2 size={16} className="mr-2" /> ปิดได้
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12 text-xs font-bold uppercase tracking-widest border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => openCloseModal('lost')}
              disabled={deal.stage === 'lost'}
            >
              <XCircle size={16} className="mr-2" /> ปิดไม่ได้
            </Button>
            <Button
              variant="ghost"
              className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm shrink-0"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 size={18} />
            </Button>
          </div>

          {/* Quick Contact */}
          {(deal.contact_email || deal.contact_phone) && (
            <div className="grid grid-cols-2 gap-3">
              {deal.contact_phone && (
                <a
                  href={`tel:${deal.contact_phone}`}
                  onClick={() => addActivityMutation.mutate({
                    deal_id: deal.id, type: 'call',
                    title: `โทรหา ${deal.contact || deal.contact_phone}`,
                    completed_at: new Date().toISOString(),
                  })}
                  className="flex items-center justify-center gap-2 h-11 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors border border-blue-100"
                >
                  <Phone size={14} /> โทร
                </a>
              )}
              {deal.contact_email && (
                <a
                  href={`mailto:${deal.contact_email}?subject=${encodeURIComponent(deal.title)}`}
                  onClick={() => addActivityMutation.mutate({
                    deal_id: deal.id, type: 'email',
                    title: `ส่งอีเมลถึง ${deal.contact_email}`,
                    completed_at: new Date().toISOString(),
                  })}
                  className="flex items-center justify-center gap-2 h-11 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-semibold transition-colors border border-violet-100"
                >
                  <Mail size={14} /> อีเมล
                </a>
              )}
            </div>
          )}

          {/* Schedule Follow-up */}
          <div className="space-y-3 p-5 rounded-2xl bg-amber-50/40 border border-amber-100">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-amber-600" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-700">นัดติดตามครั้งถัดไป</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                min={todayLocalISO()}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="h-11 px-3 rounded-xl bg-white border border-amber-200 text-sm font-semibold focus:border-amber-400 outline-none"
              />
              <Input
                placeholder="เช่น โทรเช็คงบ"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="h-11 rounded-xl bg-white border-amber-200 text-sm"
              />
            </div>
            <Button
              onClick={handleScheduleFollowUp}
              disabled={!followUpDate || addActivityMutation.isPending}
              className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ListTodo size={13} />
              สร้างนัดติดตาม
            </Button>
          </div>

          {/* Stage Workflow Checklist */}
          {STAGE_WORKFLOW[deal.stage] && (() => {
            const wf = STAGE_WORKFLOW[deal.stage];
            return (
              <div className={cn('space-y-3 p-5 rounded-2xl border', wf.color)}>
                <div className="flex items-center gap-2">
                  <ListTodo size={15} className={wf.headerColor} />
                  <h3 className={cn('text-[11px] font-black uppercase tracking-widest', wf.headerColor)}>
                    ขั้นตอน: {wf.label}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {wf.steps.map((step, i) => (
                    <li key={step.key} className="flex items-start gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed font-medium">{step.text}</span>
                    </li>
                  ))}
                </ul>
                {wf.reminder && (
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-white/70 border border-rose-200">
                    <AlertTriangle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-rose-700 leading-relaxed">{wf.reminder}</p>
                  </div>
                )}
                {/* Inactivity warning for proposal/negotiation */}
                {['proposal', 'negotiation'].includes(deal.stage) && (() => {
                  const days = Math.floor((Date.now() - new Date(deal.last_activity || deal.created_at).getTime()) / 86_400_000);
                  if (days < 3) return null;
                  const urgencyMap = {
                    7: { label: '🔴 จิกด่วน! หยุดนิ่งมา ' + days + ' วัน', cls: 'bg-rose-600 text-white' },
                    5: { label: '🟠 เสี่ยงหลุด! หยุดนิ่งมา ' + days + ' วัน', cls: 'bg-orange-500 text-white' },
                    3: { label: '🟡 ต้องตาม! หยุดนิ่งมา ' + days + ' วัน', cls: 'bg-amber-500 text-white' },
                  };
                  const cfg = days >= 7 ? urgencyMap[7] : days >= 5 ? urgencyMap[5] : urgencyMap[3];
                  return (
                    <div className={cn('mt-2 px-3 py-2 rounded-xl text-xs font-bold text-center', cfg.cls)}>
                      {cfg.label}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Activity Logger */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity size={15} className="text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">บันทึก Activity</h3>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_TYPES.filter(t => t.id !== 'task').map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveType(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                      activeType === t.id ? t.color : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    <Icon size={12} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Note textarea */}
            <Textarea
              placeholder="บันทึกรายละเอียด (ไม่บังคับ)..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="rounded-2xl bg-slate-50 border-slate-200 resize-none min-h-[80px] text-sm"
            />

            <Button
              onClick={handleLogActivity}
              disabled={addActivityMutation.isPending}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              {addActivityMutation.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />}
              บันทึก Activity
            </Button>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ประวัติ Activity ({activities.length})
            </h3>

            {activitiesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin text-slate-300" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-xs text-slate-300 text-center py-6 font-medium">ยังไม่มี Activity</p>
            ) : (
              <div className="relative space-y-3">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" />
                <AnimatePresence>
                  {activities.map((act, i) => {
                    const typeConfig = ACTIVITY_TYPES.find(t => t.id === act.type) || ACTIVITY_TYPES[3];
                    const Icon = typeConfig.icon;
                    return (
                      <motion.div
                        key={act.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex gap-4 relative"
                      >
                        <div className={cn('w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10', typeConfig.color)}>
                          <Icon size={12} />
                        </div>
                        <div className="flex-1 min-w-0 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{act.title}</p>
                            {act.scheduled_at && !act.completed_at && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">รอดำเนินการ</span>
                            )}
                          </div>
                          {act.description && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{act.description}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            {act.scheduled_at && !act.completed_at
                              ? `นัด ${new Date(act.scheduled_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
                              : timeAgo(act.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Deal Configuration */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Target size={15} className="text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">แก้ไขข้อมูลดีล</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ชื่อดีล</label>
              <Input
                value={localEdit.title}
                onChange={(e) => setField('title', e.target.value)}
                onBlur={() => saveField('title', localEdit.title)}
                className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">บริษัท</label>
              <Input
                value={localEdit.company}
                onChange={(e) => setField('company', e.target.value)}
                onBlur={() => saveField('company', localEdit.company)}
                className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">มูลค่า (บาท)</label>
                <Input
                  type="number"
                  value={localEdit.value}
                  onChange={(e) => setField('value', e.target.value)}
                  onBlur={() => saveField('value', localEdit.value)}
                  className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ความมั่นใจ (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={localEdit.probability}
                  onChange={(e) => setField('probability', e.target.value)}
                  onBlur={() => saveField('probability', localEdit.probability)}
                  className="rounded-2xl h-12 bg-slate-50 border-transparent font-bold"
                />
              </div>
            </div>

            {/* Stage selector — triggers win/loss modal for closed stages */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ขั้นตอน</label>
              <select
                value={localEdit.stage}
                onChange={(e) => {
                  const s = e.target.value;
                  if (s === 'won' || s === 'lost') {
                    openCloseModal(s);
                  } else {
                    setField('stage', s);
                    onUpdate(deal.id, { stage: s });
                  }
                }}
                disabled={deal.stage === 'won' || deal.stage === 'lost'}
                className="w-full h-12 rounded-2xl bg-slate-50 border-0 px-4 font-bold outline-none text-sm focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Expected close date */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">วันคาดว่าจะปิด</label>
              <input
                type="date"
                value={localEdit.expected_close_date}
                onChange={(e) => setField('expected_close_date', e.target.value)}
                onBlur={() => saveField('expected_close_date', localEdit.expected_close_date || null)}
                className="w-full h-12 rounded-2xl bg-slate-50 px-4 font-bold outline-none text-sm focus:ring-2 focus:ring-primary/20 border-0 transition-all"
              />
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ผู้ติดต่อ</label>
              <Input
                placeholder="ชื่อผู้ติดต่อ"
                value={localEdit.contact}
                onChange={(e) => setField('contact', e.target.value)}
                onBlur={() => saveField('contact', localEdit.contact)}
                className="rounded-2xl h-12 bg-slate-50 border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">เบอร์โทร</label>
                <Input
                  placeholder="0XX-XXX-XXXX"
                  value={localEdit.contact_phone}
                  onChange={(e) => setField('contact_phone', e.target.value)}
                  onBlur={() => saveField('contact_phone', localEdit.contact_phone)}
                  className="rounded-2xl h-12 bg-slate-50 border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">อีเมล</label>
                <Input
                  placeholder="email@company.com"
                  value={localEdit.contact_email}
                  onChange={(e) => setField('contact_email', e.target.value)}
                  onBlur={() => saveField('contact_email', localEdit.contact_email)}
                  className="rounded-2xl h-12 bg-slate-50 border-transparent"
                />
              </div>
            </div>
          </div>

          {/* AI Strategy */}
          <Card className="rounded-[2.5rem] border-primary/20 bg-primary/5 border">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">AI Sales Strategy</h3>
                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Intelligent Analysis</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-full px-4"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Refresh'}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-10 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">กำลังวิเคราะห์...</p>
                  </motion.div>
                ) : aiAnalysis ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-primary/10">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Win Likelihood</p>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{aiAnalysis.win_likelihood}%</span>
                      </div>
                      <Badge className={cn('font-bold text-[9px] px-3 py-1 rounded-full',
                        aiAnalysis.risk_level === 'high' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      )}>
                        {aiAnalysis.risk_level?.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-primary" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Directives</p>
                      </div>
                      <div className="text-xs leading-relaxed font-bold text-slate-700 bg-white p-5 rounded-3xl border border-slate-100 italic">
                        &quot;{aiAnalysis.strategy}&quot;
                      </div>
                    </div>
                    <div className="pt-4 border-t border-primary/10">
                      <div className="p-4 rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-1">Next Step</p>
                        <p className="text-sm font-black italic">&quot;{aiAnalysis.next_step}&quot;</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Zap size={24} className="text-slate-200" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Insights Available</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </SheetContent>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="ลบดีล"
        description="การดำเนินการนี้จะลบดีลและ Activity ทั้งหมดที่เชื่อมโยงอย่างถาวร"
        confirmLabel="ลบ"
        onConfirm={() => { onDelete(deal.id); setConfirmDeleteOpen(false); }}
      />

      {/* Win / Loss Reason Modal */}
      <Dialog
        open={closeModal.open}
        onOpenChange={(v) => !v && setCloseModal({ open: false, targetStage: null })}
      >
        <DialogContent className="max-w-md rounded-3xl p-8">
          <DialogHeader className="mb-6">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto',
              closeModal.targetStage === 'won' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
            )}>
              {closeModal.targetStage === 'won' ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
            </div>
            <DialogTitle className="text-xl font-bold text-center text-slate-900">
              {closeModal.targetStage === 'won' ? '🎉 ยินดีด้วย! ปิดดีลสำเร็จ' : 'ดีลไม่สำเร็จ'}
            </DialogTitle>
            <p className="text-xs text-center text-slate-500 mt-2">
              ระบุเหตุผลสั้นๆ เพื่อปรับปรุงกลยุทธ์การขาย (อย่างน้อย 5 ตัวอักษร)
            </p>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 ml-1">เหตุผล</label>
            <Textarea
              placeholder={
                closeModal.targetStage === 'won'
                  ? 'เช่น ราคาดี, ความสัมพันธ์ที่ดี, ตอบสนองได้เร็ว...'
                  : 'เช่น งบประมาณไม่พอ, เลือกเจ้าอื่น, ยกเลิกโปรเจกต์...'
              }
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="min-h-[100px] rounded-2xl bg-slate-50 border-slate-200 resize-none p-4 font-medium"
            />
            {reasonText.trim().length > 0 && reasonText.trim().length < 5 && (
              <p className="text-xs text-rose-500 ml-1">กรุณาระบุให้ชัดเจนขึ้น (อย่างน้อย 5 ตัวอักษร)</p>
            )}
          </div>

          <DialogFooter className="mt-6 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl"
              onClick={() => setCloseModal({ open: false, targetStage: null })}
            >
              ยกเลิก
            </Button>
            <Button
              disabled={reasonText.trim().length < 5}
              className={cn(
                'flex-1 rounded-xl disabled:opacity-50',
                closeModal.targetStage === 'won'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0'
                  : 'bg-rose-600 hover:bg-rose-700 text-white border-0'
              )}
              onClick={submitClose}
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
