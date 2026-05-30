/**
 * Organization logic for the personal portfolio.
 * Data lives in src/_data/organizations.json (CMS-editable).
 *
 * Model: { role, organization, startDate: "YYYY-MM", endDate: "YYYY-MM" | "" }
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function loadOrgData() {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, '..', 'src', 'content', 'organizations');
  if (!existsSync(dir)) return [];
  return (existsSync(dir) ? readdirSync(dir) : [])
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')));
}

/** Parse "YYYY-MM" into a Date (day 1), or null for "". */
export function parseMonth(value) {
  if (!value) return null;
  const [y, m] = String(value).split('-').map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
}

/** Normalize a raw JSON entry into runtime form with Date objects. */
export function normalizeOrg(raw) {
  return {
    role: raw.role,
    organization: raw.organization,
    startDate: parseMonth(raw.startDate),
    endDate: parseMonth(raw.endDate),
    order: Number.isFinite(raw.order) ? raw.order : undefined,
  };
}

/** All organizations, normalized with Date objects. */
export const organizationData = loadOrgData().map(normalizeOrg);

/**
 * Sort organizations for display.
 *   • If every org has a manual `order` (drag-to-reorder), use it.
 *   • Otherwise most recent start date first; alphabetical by organization on ties.
 * Does not mutate the input.
 */
export function sortOrganizations(orgs) {
  const allOrdered = orgs.length > 0 && orgs.every((o) => Number.isFinite(o.order));
  if (allOrdered) return [...orgs].sort((a, b) => a.order - b.order);
  return [...orgs].sort((a, b) => {
    const aT = a.startDate ? a.startDate.getTime() : 0;
    const bT = b.startDate ? b.startDate.getTime() : 0;
    if (bT !== aT) return bT - aT;
    return a.organization.localeCompare(b.organization);
  });
}

/** "MMM YYYY – MMM YYYY" or "MMM YYYY – Present". */
export function formatOrgDateRange(startDate, endDate) {
  const start = startDate
    ? `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()}`
    : '';
  if (endDate === null) return `${start} – Present`;
  const end = `${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`;
  return `${start} – ${end}`;
}
