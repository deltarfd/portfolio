/**
 * Eleventy build configuration.
 *
 * Content lives in src/_data/*.json (CMS-editable). Templates in src/ render
 * static HTML into _site/. The sorting/formatting logic in scripts/*.js is
 * reused as Eleventy filters so the page and the unit tests share one source
 * of truth.
 */

import {
  sortCertifications, formatCertDate, formatMonthYear, isExpired, normalizeCert,
} from './scripts/certifications.js';
import { sortAwards, getVisibleCount, filterByCategory } from './scripts/awards.js';
import { sortOrganizations, formatOrgDateRange, normalizeOrg } from './scripts/organizations.js';
import { sortProjects, mediaList } from './scripts/projects.js';

export default function (eleventyConfig) {
  // Content JSON files are loaded via _data loaders, not rendered as pages.
  eleventyConfig.ignores.add('src/content/**');

  // Pass static assets straight through to the output.
  eleventyConfig.addPassthroughCopy({ 'styles': 'styles' });
  eleventyConfig.addPassthroughCopy({ 'scripts/main.js': 'scripts/main.js' });
  eleventyConfig.addPassthroughCopy({ 'src/content/media': 'assets/media' });
  eleventyConfig.addPassthroughCopy({ 'src/admin': 'admin' });
  eleventyConfig.addPassthroughCopy({ 'src/favicon.png': 'favicon.png' });

  // ── Projects ───────────────────────────────────────────────────────────
  eleventyConfig.addFilter('sortProjects', (list) => sortProjects(list || []));
  // Normalized list of image sources for a project (string or array → array).
  eleventyConfig.addFilter('projectMedia', (project) => mediaList(project));

  // ── Certifications ───────────────────────────────────────────────────────
  eleventyConfig.addFilter('certNormalizeSort', (list) => {
    const normalized = (list || [])
      .map(normalizeCert)
      .filter((cert) => !isExpired(cert));
    return sortCertifications(normalized);
  });
  eleventyConfig.addFilter('certDate', (cert) => formatCertDate(cert.expirationDate));
  eleventyConfig.addFilter('certIssued', (cert) => formatMonthYear(cert.issuedDate));
  eleventyConfig.addFilter('certExpired', (cert) => isExpired(cert));

  // ── Awards ───────────────────────────────────────────────────────────────
  eleventyConfig.addFilter('sortAwards', (list) => sortAwards(list || []));
  eleventyConfig.addFilter('awardsByCategory', (list, category) =>
    filterByCategory(list || [], category)
  );
  eleventyConfig.addFilter('awardsTotal', (list) => (list || []).length);

  // ── Organizations ──────────────────────────────────────────────────────
  eleventyConfig.addFilter('orgNormalizeSort', (list) => {
    const normalized = (list || []).map(normalizeOrg);
    return sortOrganizations(normalized);
  });
  eleventyConfig.addFilter('orgRange', (org) => formatOrgDateRange(org.startDate, org.endDate));

  // ── Small string helpers ─────────────────────────────────────────────────
  // Two-digit section number, e.g. 1 -> "01".
  eleventyConfig.addFilter('pad2', (n) => String(n).padStart(2, '0'));

  // Resolve a media value to a usable src: pass absolute URLs (http(s):// or
  // protocol-relative //) through untouched; treat everything else as a local
  // path and root it with a leading slash.
  eleventyConfig.addFilter('mediaSrc', (path) => {
    if (!path) return '';
    return /^(https?:)?\/\//i.test(path) ? path : '/' + String(path).replace(/^\/+/, '');
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
}
