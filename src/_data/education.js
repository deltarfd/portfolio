/**
 * Loads education entries from src/content/education/*.json (folder collection).
 * Each file holds split fields (degree, major, institution, startDate, endDate,
 * gpa, gpaScale, note). Composes display strings and sorts newest-first by
 * startDate (falling back to `order`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', 'content', 'education');

function fmtYear(ym) {
  if (!ym) return '';
  return String(ym).split('-')[0];
}

export default function () {
  const items = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = JSON.parse(readFileSync(resolve(dir, f), 'utf-8'));
      const start = fmtYear(raw.startDate);
      const end = raw.endDate ? fmtYear(raw.endDate) : 'Present';
      return {
        ...raw,
        degreeLine: [raw.degree, raw.major].filter(Boolean).join(' · '),
        period: start ? `${start}–${end}` : '',
        gpaLine: raw.gpa ? `GPA: ${raw.gpa}${raw.gpaScale ? ` out of ${raw.gpaScale}` : ''}` : '',
        _sortKey: raw.startDate || '',
      };
    })
    .filter((d) => !d.hidden);
  // If every entry has a manual order (drag-to-reorder), use it; otherwise
  // newest startDate first, falling back to order.
  const allOrdered = items.length > 0 && items.every((e) => Number.isFinite(e.order));
  items.sort((a, b) => {
    if (allOrdered) return a.order - b.order;
    if (a._sortKey && b._sortKey && a._sortKey !== b._sortKey) return b._sortKey.localeCompare(a._sortKey);
    return (a.order ?? 0) - (b.order ?? 0);
  });
  return { items };
}
