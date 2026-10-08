'use strict';

/**
 * Pure EMI math and currency helpers. No browser dependency, so these can be
 * reasoned about and unit-tested on their own.
 *
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *   P = principal (loan amount, in rupees)
 *   r = monthly interest rate = annualRatePct / 12 / 100
 *   n = number of monthly instalments = tenureYears * 12
 */

/**
 * @param {number} principal      Loan amount in rupees (e.g. 2500000 for 25 lakh)
 * @param {number} annualRatePct  Annual interest rate as a percentage (e.g. 10 or 7.5)
 * @param {number} tenureYears    Tenure in years (e.g. 10)
 * @returns {number} EMI rounded to the nearest rupee
 */
function calculateEmi(principal, annualRatePct, tenureYears) {
  const n = Math.round(tenureYears * 12);
  const r = annualRatePct / 12 / 100;

  // Zero-interest edge case: simple division, avoids divide-by-zero below.
  if (r === 0) {
    return Math.round(principal / n);
  }

  const factor = Math.pow(1 + r, n);
  const emi = (principal * r * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * @returns {{ emi: number, totalPayment: number, totalInterest: number }}
 */
function calculateTotals(principal, annualRatePct, tenureYears) {
  const n = Math.round(tenureYears * 12);
  const emi = calculateEmi(principal, annualRatePct, tenureYears);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;
  return { emi, totalPayment, totalInterest };
}

/**
 * Convert a displayed currency string such as "₹ 33,038" into the number 33038.
 * Strips everything except digits and the decimal point.
 * @param {string|number} text
 * @returns {number} NaN when no numeric content is present
 */
function parseCurrency(text) {
  if (text === null || text === undefined) return NaN;
  const cleaned = String(text).replace(/[^0-9.]/g, '');
  return cleaned === '' ? NaN : Number(cleaned);
}

module.exports = { calculateEmi, calculateTotals, parseCurrency };
