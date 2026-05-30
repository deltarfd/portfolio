import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function () {
  const filePath = resolve(__dirname, '../content/site.json');
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}
