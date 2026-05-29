/**
 * Loads awards from src/content/awards/*.json (folder collection).
 * Display order (reverse-chronological, stable) is computed by the sortAwards
 * filter; file order here only sets the stable tiebreaker, so we sort by
 * filename for determinism.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', 'content', 'awards');

export default function () {
  const items = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')))
    .filter((d) => !d.hidden);
  return { items };
}
