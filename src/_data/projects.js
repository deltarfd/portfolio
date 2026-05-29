/**
 * Loads project entries from src/content/projects/*.json (folder collection).
 * Sorted by the `order` field; featured-first ordering is applied at render
 * time via the sortProjects filter.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', 'content', 'projects');

export default function () {
  const items = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')))
    .filter((d) => !d.hidden)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { items };
}
