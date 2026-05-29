/**
 * Loads experience entries from src/content/experience/*.json (folder
 * collection). Each file holds split fields (title, company, employmentType,
 * location, startDate, endDate, duration). This loader composes the display
 * `title` and `meta` strings the template expects, and sorts newest-first by
 * startDate (falling back to `order`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', 'content', 'experience');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtMonth(ym) {
  if (!ym) return '';
  const [y, m] = String(ym).split('-').map(Number);
  if (!y || !m) return '';
  return `${MONTHS[m - 1]} ${y}`;
}

/** Whole-month difference between two YYYY-MM strings (end defaults to now). */
function monthsBetween(startYM, endYM) {
  if (!startYM) return 0;
  const [sy, sm] = String(startYM).split('-').map(Number);
  let ey, em;
  if (endYM) { [ey, em] = String(endYM).split('-').map(Number); }
  else { const n = new Date(); ey = n.getFullYear(); em = n.getMonth() + 1; }
  if (!sy || !sm || !ey || !em) return 0;
  return Math.max(0, (ey - sy) * 12 + (em - sm));
}

/** "X yrs Y mos" / "X mos" from a month count. */
function fmtDuration(months) {
  if (months <= 0) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  const yr = y ? `${y} yr${y > 1 ? 's' : ''}` : '';
  const mo = m ? `${m} mo${m > 1 ? 's' : ''}` : '';
  return [yr, mo].filter(Boolean).join(' ');
}

function composeMeta(e) {
  // type · location · start – end · duration (duration computed automatically)
  const start = fmtMonth(e.startDate);
  const end = e.endDate ? fmtMonth(e.endDate) : 'Present';
  const range = start ? `${start} – ${end}` : '';
  const dur = fmtDuration(monthsBetween(e.startDate, e.endDate));
  const parts = [e.employmentType, e.location, range, dur].filter(Boolean);
  return parts.join(' · ');
}

function composeTitle(e) {
  return [e.title, e.company].filter(Boolean).join(' · ');
}

export default function () {
  const items = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = JSON.parse(readFileSync(resolve(dir, f), 'utf-8'));
      return {
        ...raw,
        title: composeTitle(raw),
        meta: composeMeta(raw),
        _sortKey: raw.startDate || '',
      };
    })
    .filter((d) => !d.hidden);
  // If every entry has a manual order (drag-to-reorder), use it; otherwise
  // newest startDate first, falling back to order.
  const allOrdered = items.length > 0 && items.every((e) => Number.isFinite(e.order));
  items.sort((a, b) => {
    if (allOrdered) return a.order - b.order;
    if (a._sortKey && b._sortKey && a._sortKey !== b._sortKey) {
      return b._sortKey.localeCompare(a._sortKey);
    }
    return (a.order ?? 0) - (b.order ?? 0);
  });
  return { items };
}
