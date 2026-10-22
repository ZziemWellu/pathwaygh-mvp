// Day-month-year dates, as read in Ghana and the other target countries.
// The browser default (toLocaleDateString() with no locale) follows the
// device/browser language, which is usually US English - showing
// "10/22/2026", ambiguous at best for a West African student.

const SHORT = { day: 'numeric', month: 'short', year: 'numeric' }; // 22 Oct 2026
const LONG = { day: 'numeric', month: 'long', year: 'numeric' }; // 22 October 2026

const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value, { long = false, fallback = '' } = {}) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-GB', long ? LONG : SHORT) : fallback;
};
