/**
 * Awards logic for the personal portfolio.
 * Data lives in src/_data/awards.json (CMS-editable).
 *
 * Model: { year, title, eventName, placement, category }
 *   placement: '1st Place' | '2nd Place' | '3rd Place' | 'Finalist' | 'Honoree'
 *   category:  'competition' | 'academic'
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

function loadAwardData() {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, '..', 'src', 'content', 'awards');
  if (!existsSync(dir)) return [];
  return (existsSync(dir) ? readdirSync(dir) : [])
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')));
}

// Attach a stable sourceOrder from the (filename) data order.
export const awards = loadAwardData().map((a, i) => ({ ...a, sourceOrder: i }));

/**
 * Sort awards for display.
 *   • If every award has a manual `order` (drag-to-reorder), use it.
 *   • Otherwise reverse-chronologically by year; stable within the same year.
 * Does not mutate the input.
 */
export function sortAwards(list) {
  const allOrdered = list.length > 0 && list.every((a) => Number.isFinite(a.order));
  if (allOrdered) return [...list].sort((a, b) => a.order - b.order);
  return [...list].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (a.sourceOrder ?? 0) - (b.sourceOrder ?? 0);
  });
}

/** Progressive reveal: initial 10, +5 per activation, capped at total. */
export function getVisibleCount(activations, total) {
  if (total <= 10) return total;
  return Math.min(10 + activations * 5, total);
}

/** Filter awards by category. */
export function filterByCategory(list, category) {
  return list.filter((a) => a.category === category);
}
