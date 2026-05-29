/**
 * Loads certifications from src/content/certifications/*.json (folder
 * collection). Display order is computed at render time by the
 * certNormalizeSort filter, so file order here doesn't matter.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', 'content', 'certifications');

export default function () {
  const items = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')))
    .filter((d) => !d.hidden);
  return { items };
}
