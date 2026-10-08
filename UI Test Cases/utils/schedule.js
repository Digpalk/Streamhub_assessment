'use strict';

/**
 * Pure helpers for the amortization schedule (used by the bar-chart test).
 * No browser dependency.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parse a "MMM YYYY" string (e.g. "Jan 2026") into its parts.
 * @param {string} text
 * @returns {{ month: string, monthIndex: number, year: number }}
 */
function parseMonthYear(text) {
  const [month, year] = String(text).trim().split(/\s+/);
  return { month, monthIndex: MONTHS.indexOf(month), year: parseInt(year, 10) };
}

/**
 * Number of distinct calendar years an EMI schedule spans — this equals the
 * number of (stacked) bars the yearly bar chart renders.
 * @param {string} startMonthYear e.g. "Jan 2026"
 * @param {number} tenureYears    e.g. 5
 * @returns {number}
 */
function scheduleYearCount(startMonthYear, tenureYears) {
  const { monthIndex, year } = parseMonthYear(startMonthYear);
  const months = Math.round(tenureYears * 12);
  const years = new Set();
  for (let k = 0; k < months; k++) {
    years.add(year + Math.floor((monthIndex + k) / 12));
  }
  return years.size;
}

module.exports = { MONTHS, parseMonthYear, scheduleYearCount };
