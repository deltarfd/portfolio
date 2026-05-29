import { describe, it, expect } from 'vitest';
import { projects, sortProjects, mediaList } from './projects.js';

describe('projects data', () => {
  it('contains real projects with required fields', () => {
    expect(projects.length).toBeGreaterThan(0);
    projects.forEach((p) => {
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
      expect(typeof p.description).toBe('string');
      expect(Array.isArray(p.tech)).toBe(true);
      expect(p.tech.length).toBeGreaterThan(0);
      expect(typeof p.role).toBe('string');
    });
  });

  it('links point to the real github.com/deltarfd account', () => {
    projects.forEach((p) => {
      expect(p.url).toMatch(/^https:\/\/github\.com\/deltarfd\//);
    });
  });

  it('has at least one featured project', () => {
    expect(projects.some((p) => p.featured)).toBe(true);
  });
});

describe('sortProjects', () => {
  it('places featured projects before non-featured', () => {
    const sorted = sortProjects(projects);
    let seenNonFeatured = false;
    for (const p of sorted) {
      if (!p.featured) seenNonFeatured = true;
      if (p.featured) expect(seenNonFeatured).toBe(false);
    }
  });

  it('does not mutate the input array', () => {
    const original = [...projects];
    sortProjects(projects);
    expect(projects).toEqual(original);
  });
});

describe('mediaList', () => {
  it('returns [] for missing or empty media', () => {
    expect(mediaList(undefined)).toEqual([]);
    expect(mediaList({})).toEqual([]);
    expect(mediaList({ media: '' })).toEqual([]);
    expect(mediaList({ media: [] })).toEqual([]);
  });

  it('wraps a single string into a one-element array (legacy support)', () => {
    expect(mediaList({ media: 'assets/a.png' })).toEqual(['assets/a.png']);
  });

  it('passes through an array and drops empty/whitespace entries', () => {
    expect(mediaList({ media: ['a.png', '', '  ', 'b.png'] })).toEqual(['a.png', 'b.png']);
  });

  it('trims surrounding whitespace from entries', () => {
    expect(mediaList({ media: ['  a.png  '] })).toEqual(['a.png']);
  });
});
