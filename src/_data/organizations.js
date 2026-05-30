/**
 * Loads organizations from src/content/organizations/*.json (folder
 * collection). Display order (most recent first) is computed by the
 * orgNormalizeSort filter.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', 'content', 'organizations');

export default function () {
  const items = (existsSync(dir) ? readdirSync(dir) : [])
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')))
    .filter((d) => !d.hidden);
  return { items };
}
