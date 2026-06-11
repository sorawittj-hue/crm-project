import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Calculator, Plus, Pencil, Trash2,
  Copy, Check, Loader2, FileText,
  ChevronDown, ChevronUp, Search, Battery, HardDrive, Laptop, Sparkles
} from 'lucide-react';
import { useEmailTemplates, useAddEmailTemplate, useUpdateEmailTemplate, useDeleteEmailTemplate } from '../hooks/useEmailTemplates';
import UPSCalculator from '../components/tools/UPSCalculator';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';
import RaidCalculator from '../components/tools/RaidCalculator';
import HardwareGuide from '../components/tools/HardwareGuide';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';

// ─── Email Templates ───────────────────────────────────────────────────────────
function EmailTemplates() {
  const { data: templates = [], isLoading } = useEmailTemplates();
  const { user } = useAuth();
  const { openPaywall } = useAppStore();
  const isGuest = user?.email === 'demo@novapipeline.com';

  const addMutation = useAddEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();

  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', category: 'follow_up' });
  const [editForm, setEditForm] = useState({});

  const CATEGORIES = [
    { id: 'follow_up', label: 'Follow Up', color: 'bg-blue-50 text-blue-700', border: 'border-l-blue-400' },
    { id: 'proposal', label: 'เสนอราคา', color: 'bg-violet-50 text-violet-700', border: 'border-l-violet-400' },
    { id: 'introduction', label: 'แนะนำตัว', color: 'bg-emerald-50 text-emerald-700', border: 'border-l-emerald-400' },
    { id: 'closing', label: 'ปิดดีล', color: 'bg-amber-50 text-amber-700', border: 'border-l-amber-400' },
    { id: 'win_back', label: 'Win Back', color: 'bg-rose-50 text-rose-700', border: 'border-l-rose-400' },
    { id: 'other', label: 'อื่นๆ', color: 'bg-slate-100 text-slate-700', border: 'border-l-slate-400' },
  ];

  const getCatConfig = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

  const filtered = templates.filter(t =>
    !search || 
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (isGuest) {
      openPaywall();
      return;
    }
    if (!form.name || !form.body) return;
    await addMutation.mutateAsync(form);
    setForm({ name: '', subject: '', body: '', category: 'follow_up' });
    setIsAdding(false);
  };

  const handleUpdate = async (id) => {
    if (isGuest) {
      openPaywall();
      return;
    }
    await updateMutation.mutateAsync({ id, ...editForm });
    setEditingId(null);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-violet-500" size={28} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input
            placeholder="ค้นหา template..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl text-sm border-slate-200"
          />
        </div>
        <Button
          onClick={() => isGuest ? openPaywall() : setIsAdding(true)}
          className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold border-0 shadow-md shadow-violet-500/20 shrink-0"
        >
          <Plus size={14} className="mr-2" /> เพิ่ม Template
        </Button>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <span key={c.id} className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold', c.color)}>{c.label}</span>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-6 md:p-8 rounded-[2rem] border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white/80 backdrop-blur-xl shadow-2xl shadow-violet-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-400/10 rounded-bl-full -z-0 pointer-events-none" />
              <h4 className="text-sm font-black text-violet-700 uppercase tracking-wider mb-5 relative z-10 flex items-center gap-2">
                <Sparkles size={14} /> เพิ่ม Template ใหม่
              </h4>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">ชื่อ Template *</label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="เช่น Follow Up หลังเสนอราคา" className="h-9 rounded-xl text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">หมวดหมู่</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none">
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Subject Email</label>
                  <Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                    placeholder="เช่น ติดตามใบเสนอราคา [ชื่อดีล]" className="h-9 rounded-xl text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">เนื้อหา Email *</label>
                  <p className="text-[10px] text-slate-400">ใช้ {'{{name}}'}, {'{{company}}'}, {'{{value}}'} เพื่อแทรกข้อมูล</p>
                  <Textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                    placeholder={'สวัสดีคุณ {{name}},\n\nขอบคุณที่ให้ความสนใจ...'} rows={6}
                    className="rounded-xl text-sm resize-none" required />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}
                    className="h-9 px-4 rounded-xl text-sm text-slate-500">ยกเลิก</Button>
                  <Button type="submit" disabled={addMutation.isPending}
                    className="h-9 px-5 rounded-xl bg-violet-600 text-white text-sm border-0">
                    {addMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                    บันทึก
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template list */}
      {filtered.length === 0 && !isAdding && (
        <div className="text-center py-16 space-y-3">
          <FileText size={32} className="text-slate-200 mx-auto" />
          <p className="text-sm font-medium text-slate-400">ยังไม่มี Email Template</p>
          <p className="text-xs text-slate-300">คลิก &quot;เพิ่ม Template&quot; เพื่อสร้าง template แรก</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(t => {
          const cat = getCatConfig(t.category);
          const isExpanded = expandedId === t.id;
          const isEditing = editingId === t.id;

          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className={cn(
                "rounded-[1.5rem] overflow-hidden border-y border-r border-slate-100/80 border-l-4 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 bg-white/60 backdrop-blur-md group",
                cat.border || "border-l-slate-200"
              )}>
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={cn('px-2.5 py-0.5 rounded-lg text-[10px] font-bold shrink-0', cat.color)}>{cat.label}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{t.name}</p>
                        {t.subject && <p className="text-xs text-slate-400 truncate mt-0.5">Subject: {t.subject}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleCopy(t.body, t.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        {copiedId === t.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button onClick={() => {
                        if (isGuest) {
                          openPaywall();
                        } else {
                          setEditingId(t.id);
                          setEditForm({ name: t.name, subject: t.subject || '', body: t.body, category: t.category || 'other' });
                          setExpandedId(null);
                        }
                      }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => isGuest ? openPaywall() : deleteMutation.mutate(t.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && !isEditing && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 md:px-5 pb-5 border-t border-slate-100/80 pt-4">
                        <pre className="text-[13px] text-slate-600 whitespace-pre-wrap font-medium leading-relaxed bg-slate-50/80 border border-slate-100 rounded-2xl p-4 shadow-inner">{t.body}</pre>
                        <button onClick={() => handleCopy(t.body, t.id + '-body')}
                          className="mt-2 flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-semibold">
                          {copiedId === t.id + '-body' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === t.id + '-body' ? 'คัดลอกแล้ว!' : 'คัดลอก Body'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {isEditing && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">ชื่อ</label>
                            <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                              className="h-9 rounded-xl text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">หมวดหมู่</label>
                            <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}
                              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none">
                              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Subject</label>
                          <Input value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})}
                            className="h-9 rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Body</label>
                          <Textarea value={editForm.body} onChange={e => setEditForm({...editForm, body: e.target.value})}
                            rows={5} className="rounded-xl text-sm resize-none" />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" onClick={() => setEditingId(null)}
                            className="h-9 px-4 rounded-xl text-sm text-slate-500">ยกเลิก</Button>
                          <Button onClick={() => handleUpdate(t.id)} disabled={updateMutation.isPending}
                            className="h-9 px-5 rounded-xl bg-violet-600 text-white text-sm border-0">บันทึก</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Deal ROI Calculator ───────────────────────────────────────────────────────
function DealCalculator() {
  const [dealValue, setDealValue] = useState('');
  const [cost, setCost] = useState('');
  const [probability, setProbability] = useState('70');
  const [months, setMonths] = useState('3');

  const calc = (() => {
    const v = Number(dealValue) || 0;
    const c = Number(cost) || 0;
    const p = Number(probability) / 100;
    const m = Number(months) || 1;
    const grossProfit = v - c;
    const margin = v > 0 ? (grossProfit / v) * 100 : 0;
    const expectedRevenue = v * p;
    const expectedProfit = grossProfit * p;
    const monthlyRevenue = v / m;
    const roi = c > 0 ? ((grossProfit / c) * 100) : 0;
    return { grossProfit, margin, expectedRevenue, expectedProfit, monthlyRevenue, roi };
  })();

  const SCENARIOS = [
    { label: 'Worst Case (30%)', value: Number(dealValue) * 0.3, bg: 'from-rose-50 to-rose-100/50', border: 'border-rose-200', text: 'text-rose-700' },
    { label: 'Commit (70%)', value: Number(dealValue) * 0.7, bg: 'from-amber-50 to-amber-100/50', border: 'border-amber-200', text: 'text-amber-700' },
    { label: 'Best Case (100%)', value: Number(dealValue), bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200', text: 'text-emerald-700' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-5 space-y-5 bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0" />
          <h3 className="text-xs font-black uppercase tracking-wider text-violet-600 flex items-center gap-2 relative z-10">
            <Calculator size={14} /> พารามิเตอร์ของดีล
          </h3>
          <div className="space-y-4 relative z-10">
            {[
              { label: 'มูลค่าดีล (Revenue)', value: dealValue, setter: setDealValue, placeholder: '1,000,000', prefix: '฿' },
              { label: 'ต้นทุน (Cost/COGS)', value: cost, setter: setCost, placeholder: '600,000', prefix: '฿' },
            ].map(f => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{f.prefix}</span>
                  <Input type="number" value={f.value} onChange={e => f.setter(e.target.value)}
                    placeholder={f.placeholder} className="h-12 pl-8 rounded-xl text-base font-bold bg-white/80 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20" />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">โอกาสปิด (%)</label>
                <div className="relative">
                  <Input type="number" min="0" max="100" value={probability} onChange={e => setProbability(e.target.value)}
                    className="h-12 pr-8 rounded-xl text-base font-bold bg-white/80 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ระยะเวลา (ด.)</label>
                <Input type="number" min="1" value={months} onChange={e => setMonths(e.target.value)}
                  className="h-12 rounded-xl text-base font-bold bg-white/80 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" /> การวิเคราะห์ผลตอบแทน (ROI Analysis)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'กำไรขั้นต้น', value: formatCurrency(calc.grossProfit), color: calc.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: 'bg-white', border: 'border-slate-100' },
              { label: 'Margin', value: `${calc.margin.toFixed(1)}%`, color: calc.margin >= 20 ? 'text-emerald-600' : calc.margin >= 10 ? 'text-amber-600' : 'text-rose-600', bg: 'bg-white', border: 'border-slate-100' },
              { label: 'ROI', value: `${calc.roi.toFixed(0)}%`, color: calc.roi >= 100 ? 'text-emerald-600' : calc.roi >= 50 ? 'text-amber-600' : 'text-rose-600', bg: 'bg-white', border: 'border-slate-100' },
              { label: 'Expected Revenue', value: formatCurrency(calc.expectedRevenue), color: 'text-violet-700', bg: 'bg-violet-50/50', border: 'border-violet-100' },
              { label: 'Expected Profit', value: formatCurrency(calc.expectedProfit), color: 'text-violet-700', bg: 'bg-violet-50/50', border: 'border-violet-100' },
              { label: 'รายได้ต่อเดือน', value: formatCurrency(calc.monthlyRevenue), color: 'text-blue-700', bg: 'bg-blue-50/50', border: 'border-blue-100' },
            ].map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={m.label} 
                className={cn('p-4 rounded-2xl border shadow-sm', m.bg, m.border)}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
                <p className={cn('text-lg sm:text-xl font-black tabular-nums tracking-tight', m.color)}>{m.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="pt-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">ฉากทัศน์คาดการณ์ (Forecast Scenarios)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SCENARIOS.map((s, i) => (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + (i * 0.1) }} 
                  key={s.label} className={cn('p-5 rounded-2xl border bg-gradient-to-br shadow-sm relative overflow-hidden group', s.bg, s.border)}>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className={cn('text-[10px] font-black uppercase tracking-wider mb-1 opacity-70', s.text)}>{s.label}</p>
                  <p className={cn('text-xl font-black tabular-nums tracking-tight', s.text)}>{formatCurrency(s.value)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    key: 'email',
    icon: Mail,
    title: 'Email Templates',
    subtitle: 'จัดการ template อีเมลสำหรับทุก stage',
    gradient: 'from-violet-500 to-purple-600',
    badges: [
      { label: 'Follow Up', color: 'bg-blue-50 border-blue-100 text-blue-700' },
      { label: 'Proposal', color: 'bg-violet-50 border-violet-100 text-violet-700' },
      { label: 'Closing', color: 'bg-amber-50 border-amber-100 text-amber-700' },
    ],
    desc: 'สร้างและจัดการ email template สำหรับทุกขั้นตอนการขาย พร้อม copy-paste ได้ทันที',
    component: EmailTemplates,
  },
  {
    key: 'roi',
    icon: Calculator,
    title: 'Deal Calculator',
    subtitle: 'คำนวณกำไร, Margin, ROI และ Forecast',
    gradient: 'from-emerald-500 to-teal-600',
    badges: [
      { label: 'ROI Analysis', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
      { label: 'Scenarios', color: 'bg-blue-50 border-blue-100 text-blue-700' },
    ],
    desc: 'วิเคราะห์ความคุ้มค่าของดีล — gross profit, margin, expected revenue ตาม probability',
    component: DealCalculator,
  },
  {
    key: 'ups',
    icon: Battery,
    title: 'คำนวณ UPS',
    subtitle: 'คำนวณ VA และ Ah ที่ต้องการสำหรับ UPS',
    gradient: 'from-blue-500 to-cyan-500',
    badges: [
      { label: 'VA Calculator', color: 'bg-blue-50 border-blue-100 text-blue-700' },
      { label: 'Battery Config', color: 'bg-amber-50 border-amber-100 text-amber-700' },
    ],
    desc: 'คำนวณขนาด UPS ที่เหมาะสมและ configuration ของ battery สำหรับ load ขององค์กร',
    component: UPSCalculator,
  },
  {
    key: 'raid',
    icon: HardDrive,
    title: 'คำนวณ RAID',
    subtitle: 'คำนวณพื้นที่ใช้งานได้ vs ความทนทาน',
    gradient: 'from-amber-500 to-orange-500',
    badges: [
      { label: 'RAID 0/1/5/6/10', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
      { label: 'Efficiency %', color: 'bg-purple-50 border-purple-100 text-purple-700' },
    ],
    desc: 'เปรียบเทียบ RAID level ต่างๆ — พื้นที่จริงที่ใช้ได้, fault tolerance และ performance tradeoff',
    component: RaidCalculator,
  },
  {
    key: 'hardware',
    icon: Laptop,
    title: 'คู่มือ Hardware 2026',
    subtitle: 'อ้างอิง spec PC, Server และ Network',
    gradient: 'from-violet-500 to-purple-500',
    badges: [
      { label: 'Laptops', color: 'bg-violet-50 border-violet-100 text-violet-700' },
      { label: 'Servers', color: 'bg-slate-100 border-slate-200 text-slate-700' },
      { label: 'Network', color: 'bg-cyan-50 border-cyan-100 text-cyan-700' },
    ],
    desc: 'สเปกฮาร์ดแวร์ระดับองค์กร — Laptops, Servers และ Network equipment สำหรับใช้ประกอบการขาย',
    component: HardwareGuide,
  },
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('email');
  const activeTool = TOOLS.find(t => t.key === activeTab);
  const ActiveComponent = activeTool?.component;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1400px] mx-auto pb-20 px-4 md:px-0"
    >
      <header className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white shrink-0">
          <Sparkles size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-0.5">Nova Pipeline</p>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">เครื่องมือ</h1>
          <p className="text-sm text-slate-400 mt-0.5 font-medium">คำนวณ คาดการณ์ และสร้างเนื้อหา</p>
        </div>
      </header>

      {/* Tab List */}
      <div className="mb-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        <div className="inline-flex gap-2 bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-sm min-w-max">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.key;
            return (
              <button
                key={tool.key}
                onClick={() => setActiveTab(tool.key)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                  isActive ? `bg-gradient-to-r ${tool.gradient} text-white shadow-md` : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                )}
              >
                <Icon size={14} strokeWidth={2.5} />
                {tool.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tool Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-3xl overflow-hidden relative"
        >
          {/* Glass glare effect */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80 z-10" />
          
          <div className={`h-1.5 bg-gradient-to-r ${activeTool.gradient} relative z-10`} />

          <div className="px-6 py-8 md:px-12 md:py-10 border-b border-slate-100/80 relative bg-gradient-to-b from-white to-transparent">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <activeTool.icon size={160} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10">
              <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${activeTool.gradient} flex items-center justify-center text-white shadow-xl shadow-${activeTool.gradient.split(' ')[0].split('-')[1]}/30 shrink-0 transform transition-transform hover:scale-105 hover:rotate-3`}>
                <activeTool.icon size={28} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{activeTool.title}</h2>
                <p className="text-sm text-slate-500 font-medium">{activeTool.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {activeTool.badges.map(b => (
                  <span key={b.label} className={cn('px-3.5 py-1.5 rounded-xl border text-[11px] font-bold tracking-wide uppercase', b.color)}>{b.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-12 relative z-10">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
