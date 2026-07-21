import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, MessageSquare, Send, Bot, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { formatCurrency } from '../../lib/formatters';

const TEMPLATES = [
  { label: 'ติดตามใบเสนอราคา', type: 'proposal' },
  { label: 'เสนอโปรโมชันพิเศษ', type: 'discount' },
  { label: 'นัดหมายการประชุมซ้ำ', type: 'meeting' },
  { label: 'ทักทายสร้างความสนิทสนม', type: 'friendly' },
];

export default function AIFollowUpModal({ open, onOpenChange, deal }) {
  const [copied, setCopied] = useState(false);
  const [templateType, setTemplateType] = useState('proposal');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const company = deal?.company || 'ลูกค้า';
  const dealTitle = deal?.title || 'ข้อเสนอโครงการ';
  const valStr = deal?.value ? formatCurrency(deal.value) : '';

  const generateDraft = (type) => {
    switch (type) {
      case 'proposal':
        return `สวัสดีครับ/ค่ะ คุณ${company}\n\nทางเราขออนุญาตสอบถามความคืบหน้าเกี่ยวกับเอกสารข้อเสนอโครงการ "${dealTitle}" (มูลค่า ${valStr}) ที่ได้จัดส่งให้พิจารณาก่อนหน้านี้ครับ ไม่ทราบว่ามีข้อสงสัยหรือต้องการให้ปรับแก้รายละเอียดส่วนใดเพิ่มเติมหรือไม่ครับ?\n\nทางเรายินดีปรับเปลี่ยนเพื่อให้ตอบโจทย์องค์กรของท่านมากที่สุดครับ 😊`;
      case 'discount':
        return `เรียน คุณ${company}\n\nเนื่องจากโครงการ "${dealTitle}" เป็นโครงการสำคัญ ทางทีมงานได้เสนออนุมัติส่วนลดพิเศษเพิ่มเติมประจำเดือนนี้ให้เรียบร้อยแล้วครับ หากอนุมัติภายในสัปดาห์นี้ จะได้รับสิทธิพิเศษเพิ่มเติมทันทีครับ\n\nสะดวกให้ทางเราโทรเข้าไปสรุปรายละเอียดสั้นๆ สัก 5 นาทีไหมครับ?`;
      case 'meeting':
        return `สวัสดีครับ/ค่ะ ทางเราขออนุญาตขอเวลานัดหมายสั้นๆ 15 นาทีผ่าน Online Meeting กับคุณ${company} เพื่ออัปเดตความคืบหน้าของโครงการ "${dealTitle}" และตอบข้อสงสัยเพิ่มเติมครับ\n\nสะดวกเป็นวันไหนช่วงเวลาใดดีครับ?`;
      case 'friendly':
      default:
        return `สวัสดีครับ/ค่ะ คุณ${company} หวังว่าสัปดาห์นี้จะเป็นสัปดาห์ที่ดีนะครับ 😊\n\nขออนุญาตทักทายและอัปเดตโครงการ "${dealTitle}" สั้นๆ ครับ หากมีหัวข้อไหนที่อยากให้ทีมงานเข้าไปซัพพอร์ตเพิ่มเติม สามารถแจ้งได้ตลอดเลยนะครับ!`;
    }
  };

  const [messageDraft, setMessageDraft] = useState(() => generateDraft('proposal'));

  const handleSelectTemplate = (type) => {
    setTemplateType(type);
    setIsGenerating(true);
    setTimeout(() => {
      setMessageDraft(generateDraft(type));
      setIsGenerating(false);
    }, 300);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-white/95 backdrop-blur-3xl border-0 shadow-2xl rounded-[2rem] relative">
        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600" />
        <div className="p-7">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <Bot size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-1.5">
                  AI Smart Follow-Up Draft
                  <Sparkles size={16} className="text-amber-400 fill-amber-400" />
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-400">
                  สร้างข้อความติดตามลูกค้าอัจฉริยะสำหรับดีล: {company}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-5">
            {/* Template selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลือกบริบทข้อความ</label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map(t => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleSelectTemplate(t.type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      templateType === t.type
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md shadow-violet-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated message text area */}
            <div className="relative">
              <Textarea
                rows={7}
                value={messageDraft}
                onChange={e => setMessageDraft(e.target.value)}
                className="bg-slate-50/70 border-slate-200/80 rounded-2xl text-xs font-medium leading-relaxed p-4 focus:bg-white focus:border-violet-400"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 text-violet-600 text-xs font-bold">
                  <RefreshCw size={16} className="animate-spin" />
                  กำลังเรียบเรียงข้อความใหม่...
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs font-bold" onClick={() => onOpenChange(false)}>
                ปิด
              </Button>
              <Button
                type="button"
                onClick={handleCopy}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกข้อความนำไปใช้'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
