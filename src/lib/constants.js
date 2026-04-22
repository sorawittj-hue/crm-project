/**
 * Shared constants for Zenith CRM
 * All stage labels are Thai and are the single source of truth used
 * across PipelineBoard, PipelinePage, Analytics, and any forms.
 */

export const STAGES = [
  { id: 'lead', label: 'ลูกค้าใหม่' },
  { id: 'contact', label: 'นัดเจอ' },
  { id: 'proposal', label: 'เสนอราคา' },
  { id: 'negotiation', label: 'กำลังปิด' },
  { id: 'won', label: 'ปิดได้' },
  { id: 'lost', label: 'ปิดไม่ได้' },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

export const STAGE_LABELS = STAGES.reduce((acc, s) => {
  acc[s.id] = s.label;
  return acc;
}, {});

export const STAGE_COLORS = {
  lead: '#6366f1',
  contact: '#8b5cf6',
  proposal: '#ec4899',
  negotiation: '#f97316',
  won: '#10b981',
  lost: '#ef4444',
};
