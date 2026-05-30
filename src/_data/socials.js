import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function () {
  const dir = resolve(__dirname, '../content/socials');
  if (!existsSync(dir)) return [];
  const files = (existsSync(dir) ? readdirSync(dir) : []).filter((f) => f.endsWith('.json'));
  const items = [];
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(resolve(dir, f), 'utf-8'));
      if (!data.hidden) items.push(data);
    } catch (e) {
      // ignore
    }
  }
  return items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}
