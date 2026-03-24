/**
 * Shared currency and date formatters for Zenith CRM
 */

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount || 0);

export const formatFullCurrency = (amount) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const daysSince = (dateStr) =>
  Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);
