/**
 * Project logic for the personal portfolio.
 * Data lives in src/_data/projects.json (CMS-editable).
 *
 * Model: { name, role, description, tech: string[], url, featured }
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

function loadProjectData() {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, '..', 'src', 'content', 'projects');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** All projects as authored (manual order). */
export const projects = loadProjectData();

/**
 * Normalize a project's media into an array of image sources.
 * Accepts `media` as a string (single) or array, plus a legacy single value.
 * Filters out empty entries. Does not mutate the input.
 */
export function mediaList(project) {
  if (!project) return [];
  const raw = project.media;
  const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return arr.map((s) => String(s || '').trim()).filter(Boolean);
}

/**
 * Sort projects for display.
 *   • If every project has a manual `order` (drag-to-reorder), use it.
 *   • Otherwise featured first, original order preserved within each group.
 * Does not mutate the input.
 */
export function sortProjects(list) {
  const allOrdered = list.length > 0 && list.every((p) => Number.isFinite(p.order));
  if (allOrdered) return [...list].sort((a, b) => a.order - b.order);
  return [...list].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
  );
}
