/**
 * Shared currency and date formatters for Zenith CRM.
 * Everything is Thai locale by default so pages stay consistent.
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

/**
 * Convert any date-like input into a Date using Buddhist-era year (+543)
 * formatting. Returns a dash when the input is missing / invalid so UIs
 * don't render "Invalid Date".
 */
const toDate = (input) => {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatThaiDate = (input) => {
  const d = toDate(input);
  if (!d) return '—';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const formatThaiDateLong = (input) => {
  const d = toDate(input);
  if (!d) return '—';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

export const formatThaiDateTime = (input) => {
  const d = toDate(input);
  if (!d) return '—';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};
