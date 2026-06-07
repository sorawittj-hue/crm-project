import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function parseYearMonth(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return { year: dateVal.getFullYear(), month: dateVal.getMonth() };
  }
  if (typeof dateVal === 'string') {
    if (dateVal.includes('-')) {
      const parts = dateVal.slice(0, 10).split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        return { year, month };
      }
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() };
}
