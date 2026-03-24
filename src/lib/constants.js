/**
 * Shared constants for Zenith CRM
 */

export const STAGES = [
  { id: 'lead', label: 'New Lead' },
  { id: 'contact', label: 'Meeting' },
  { id: 'proposal', label: 'Quotation' },
  { id: 'negotiation', label: 'Closing' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

export const STAGE_IDS = STAGES.map(s => s.id);

export const STAGE_COLORS = {
  lead: '#6366f1',
  contact: '#8b5cf6',
  proposal: '#ec4899',
  negotiation: '#f97316',
  won: '#10b981',
  lost: '#ef4444',
};
