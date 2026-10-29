/**
 * currency.js
 * ---------------------------------------------------------------------------
 * Single source of truth for all price / currency formatting across the
 * dashboard and storefront.
 *
 * Currency: Indian Rupee (INR, ₹)
 * Locale  : en-IN  — uses Indian number grouping (1,00,000 style)
 */

const LOCALE   = 'en-IN';
const CURRENCY = 'INR';

/**
 * Format a number as Indian Rupees.
 *
 * @param {number|null|undefined} amount
 * @param {object}  [opts]
 * @param {number}  [opts.decimals=2]   - fraction digits (0 for whole rupees)
 * @param {string}  [opts.fallback='—'] - returned when amount is null / undefined
 * @returns {string}  e.g. "₹12,499.00" or "₹1,05,000"
 *
 * @example
 * formatINR(12499)          // "₹12,499.00"
 * formatINR(12499, { decimals: 0 })  // "₹12,499"
 * formatINR(null)           // "—"
 * formatINR(4.2)            // "₹4.20"
 */
export function formatINR(amount, { decimals = 2, fallback = '—' } = {}) {
  if (amount == null || amount === '') return fallback;
  return new Intl.NumberFormat(LOCALE, {
    style:                 'currency',
    currency:              CURRENCY,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(amount));
}

/**
 * Compact label for the currency, e.g. to use in form field labels.
 * "Unit cost (₹)" instead of "Unit cost (USD)".
 */
export const CURRENCY_LABEL = '₹ INR';

