/**
 * Utility functions for the personal portfolio.
 * Pure functions for date formatting, duration calculation, and sorting.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Calculate the duration between two dates as a human-readable string.
 * Returns "X yrs Y mos" when total months >= 12, or "X mos" when < 12.
 * If endDate is null, uses the current date.
 *
 * @param {Date} startDate - The start date (month precision)
 * @param {Date|null} endDate - The end date, or null for "Present"
 * @returns {string} Duration string
 */
export function calculateDuration(startDate, endDate) {
  const end = endDate || new Date();

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

  if (totalMonths < 12) {
    return `${totalMonths} mos`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (months === 0) {
    return `${years} yrs 0 mos`;
  }

  return `${years} yrs ${months} mos`;
}

/**
 * Format a date range as "MMM YYYY – MMM YYYY" or "MMM YYYY – Present".
 *
 * @param {Date} startDate - The start date
 * @param {Date|null} endDate - The end date, or null for "Present"
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate) {
  const startStr = `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()}`;

  if (endDate === null) {
    return `${startStr} – Present`;
  }

  const endStr = `${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`;
  return `${startStr} – ${endStr}`;
}

/**
 * Sort roles by startDate in descending order (most recent first).
 * Does not mutate the original array.
 *
 * @param {Array<{startDate: Date}>} roles - Array of role objects
 * @returns {Array<{startDate: Date}>} New array sorted by startDate descending
 */
export function sortRoles(roles) {
  return [...roles].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}
