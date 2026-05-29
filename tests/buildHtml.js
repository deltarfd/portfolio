/**
 * Test helper: returns the built site HTML (_site/index.html), running the
 * Eleventy build first if the output is missing or stale relative to sources.
 * This ensures DOM/accessibility tests validate what actually ships.
 */
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, '_site', 'index.html');

function newestMtime(paths) {
  let newest = 0;
  for (const p of paths) {
    if (existsSync(p)) newest = Math.max(newest, statSync(p).mtimeMs);
  }
  return newest;
}

export function getBuiltHtml() {
  const template = resolve(root, 'src', 'index.njk');
  const dataDir = resolve(root, 'src', '_data');
  const sourcesNewest = newestMtime([
    template,
    resolve(dataDir, 'site.json'),
    resolve(dataDir, 'projects.json'),
    resolve(dataDir, 'experience.json'),
    resolve(dataDir, 'skills.json'),
    resolve(dataDir, 'certifications.json'),
    resolve(dataDir, 'awards.json'),
    resolve(dataDir, 'organizations.json'),
  ]);
  const built = existsSync(out) ? statSync(out).mtimeMs : 0;

  if (!existsSync(out) || built < sourcesNewest) {
    execSync('npx @11ty/eleventy', { cwd: root, stdio: 'pipe' });
  }
  return readFileSync(out, 'utf-8');
}
