import { describe, it, expect } from 'vitest';
import {
  normalizeCert, sortCertifications, formatMonthYear, parseExpiration,
} from './certifications.js';

describe('normalizeCert', () => {
  it('parses issued and expiration into Date objects', () => {
    const c = normalizeCert({ name: 'X', organization: 'Y', issued: '2023-04', expiration: '2026-04' });
    expect(c.issuedDate).toBeInstanceOf(Date);
    expect(c.expirationDate).toBeInstanceOf(Date);
    expect(c.issuedDate.getFullYear()).toBe(2023);
    expect(c.issuedDate.getMonth()).toBe(3); // April = index 3
  });

  it('treats missing issued/expiration as null', () => {
    const c = normalizeCert({ name: 'X', organization: 'Y' });
    expect(c.issuedDate).toBeNull();
    expect(c.expirationDate).toBeNull();
  });

  it('passes order through only when finite', () => {
    expect(normalizeCert({ order: 3 }).order).toBe(3);
    expect(normalizeCert({}).order).toBeUndefined();
  });
});

describe('formatMonthYear', () => {
  it('formats a Date as "MMM YYYY"', () => {
    expect(formatMonthYear(parseExpiration('2025-01'))).toBe('Jan 2025');
  });
  it('returns "" for null/absent', () => {
    expect(formatMonthYear(null)).toBe('');
    expect(formatMonthYear(undefined)).toBe('');
  });
});

describe('sortCertifications', () => {
  const cert = (over) => normalizeCert({ name: 'c', organization: 'o', ...over });

  it('places featured (isKey) before non-featured', () => {
    const sorted = sortCertifications([
      cert({ name: 'plain', expiration: '2026-01' }),
      cert({ name: 'key', isKey: true }),
    ]);
    expect(sorted[0].name).toBe('key');
  });

  it('honors explicit manual order when both have it', () => {
    const sorted = sortCertifications([
      cert({ name: 'second', order: 2 }),
      cert({ name: 'first', order: 1 }),
    ]);
    expect(sorted.map((c) => c.name)).toEqual(['first', 'second']);
  });

  it('orders non-featured by expiration descending, non-expiring last', () => {
    const sorted = sortCertifications([
      cert({ name: 'noexp' }),
      cert({ name: 'old', expiration: '2020-01' }),
      cert({ name: 'new', expiration: '2030-01' }),
    ]);
    expect(sorted.map((c) => c.name)).toEqual(['new', 'old', 'noexp']);
  });

  it('does not mutate the input', () => {
    const input = [cert({ name: 'a', expiration: '2026-01' }), cert({ name: 'b', isKey: true })];
    const snapshot = [...input];
    sortCertifications(input);
    expect(input).toEqual(snapshot);
  });

  it('sorts purely by manual order when EVERY cert has one (drag-to-reorder)', () => {
    const sorted = sortCertifications([
      cert({ name: 'third', isKey: true, order: 3 }),
      cert({ name: 'first', order: 1 }),
      cert({ name: 'second', isKey: true, order: 2 }),
    ]);
    // Manual order wins over featured-first when all are ordered.
    expect(sorted.map((c) => c.name)).toEqual(['first', 'second', 'third']);
  });

  it('ignores manual order unless ALL certs have one', () => {
    const sorted = sortCertifications([
      cert({ name: 'ordered', order: 1 }),
      cert({ name: 'featured', isKey: true }),
    ]);
    // Not all ordered → featured-first rule applies.
    expect(sorted[0].name).toBe('featured');
  });
});
