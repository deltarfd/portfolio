/**
 * Certification logic for the personal portfolio.
 * Data lives in src/_data/certifications.json (CMS-editable). This module
 * provides parsing, classification, formatting, and sorting helpers.
 *
 * JSON model (per entry):
 * {
 *   name: string,
 *   organization: string,
 *   expiration: "YYYY-MM" | "",   // "" = no expiration
 *   isKey: boolean,
 *   keyOrder?: number             // featured order
 * }
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function loadCertData() {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, '..', 'src', 'content', 'certifications');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')));
}

/** Parse a "YYYY-MM" string into a Date (day 1), or null for "". */
export function parseExpiration(value) {
  if (!value) return null;
  const [y, m] = String(value).split('-').map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
}

/** Normalize a raw JSON entry into a runtime cert with Date objects. */
export function normalizeCert(raw) {
  return {
    name: raw.name,
    organization: raw.organization,
    issuedDate: parseExpiration(raw.issued),
    expirationDate: parseExpiration(raw.expiration),
    isKey: Boolean(raw.isKey),
    keyOrder: raw.keyOrder,
    order: Number.isFinite(raw.order) ? raw.order : undefined,
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    credentialUrl: raw.credentialUrl || '',
    media: raw.media || '',
  };
}

/** True when a cert has a real expiration date in the past. */
export function isExpired(cert, now = new Date()) {
  if (!cert || cert.expirationDate === null) return false;
  return cert.expirationDate < now;
}

/** "MMM YYYY" for a Date, or "No Expiration" for null. */
export function formatCertDate(date) {
  if (date === null) return 'No Expiration';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** "MMM YYYY" for a Date, or "" when absent (used for the issued date). */
export function formatMonthYear(date) {
  if (!date) return '';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Sort certifications for display.
 *   • If every cert has a manual `order` (set via drag-to-reorder), sort
 *     purely by that order — the user's arrangement wins.
 *   • Otherwise: featured (isKey) first, ordered by keyOrder; then the rest
 *     by expiration date descending, non-expiring (null) last.
 * Does not mutate the input.
 */
export function sortCertifications(certs) {
  const has = (v) => Number.isFinite(v);
  const allOrdered = certs.length > 0 && certs.every((c) => has(c.order));
  if (allOrdered) return [...certs].sort((a, b) => a.order - b.order);
  return [...certs].sort((a, b) => {
    if (a.isKey !== b.isKey) return a.isKey ? -1 : 1;
    if (a.isKey && b.isKey) {
      const ak = has(a.keyOrder) ? a.keyOrder : 0;
      const bk = has(b.keyOrder) ? b.keyOrder : 0;
      if (ak !== bk) return ak - bk;
    }
    if (a.expirationDate === null && b.expirationDate === null) return 0;
    if (a.expirationDate === null) return 1;
    if (b.expirationDate === null) return -1;
    return b.expirationDate.getTime() - a.expirationDate.getTime();
  });
}

/** All certifications, normalized with Date objects. */
export const certifications = loadCertData().map(normalizeCert);
