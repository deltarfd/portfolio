/**
 * Loads skill categories from src/content/skills/*.json (folder collection).
 * Sorted by the `order` field.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', 'content', 'skills');

export default function () {
  const items = (existsSync(dir) ? readdirSync(dir) : [])
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')))
    .filter((d) => !d.hidden)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { items };
}
