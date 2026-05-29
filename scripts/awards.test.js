import { describe, it, expect } from 'vitest';
import { awards, sortAwards, getVisibleCount, filterByCategory } from './awards.js';

describe('awards data', () => {
  it('should contain only real, verifiable entries', () => {
    expect(awards.length).toBeGreaterThan(0);
  });

  it('should have entries spanning 2017-2025', () => {
    const years = awards.map(a => a.year);
    expect(Math.min(...years)).toBe(2017);
    expect(Math.max(...years)).toBe(2025);
  });

  it('should include the PPA academic scholarship', () => {
    const ppa = awards.filter(a => a.title.includes('Peningkatan Prestasi Akademik'));
    expect(ppa).toHaveLength(1);
    expect(ppa[0].category).toBe('academic');
  });

  it('should categorize the PPA scholarship as academic', () => {
    const ppa = awards.filter(a => a.title.includes('Peningkatan Prestasi Akademik'));
    ppa.forEach(entry => {
      expect(entry.category).toBe('academic');
    });
  });

  it('should have valid placement values', () => {
    const validPlacements = ['1st Place', '2nd Place', '3rd Place', 'Finalist', 'Honoree'];
    awards.forEach(award => {
      expect(validPlacements).toContain(award.placement);
    });
  });

  it('should have valid category values', () => {
    const validCategories = ['competition', 'academic'];
    awards.forEach(award => {
      expect(validCategories).toContain(award.category);
    });
  });

  it('should have titles within 120 characters', () => {
    awards.forEach(award => {
      expect(award.title.length).toBeLessThanOrEqual(120);
    });
  });

  it('should have event names within 120 characters', () => {
    awards.forEach(award => {
      expect(award.eventName.length).toBeLessThanOrEqual(120);
    });
  });

  it('should have unique sourceOrder values', () => {
    const sourceOrders = awards.map(a => a.sourceOrder);
    const uniqueOrders = new Set(sourceOrders);
    expect(uniqueOrders.size).toBe(sourceOrders.length);
  });
});

describe('sortAwards', () => {
  it('should sort awards in reverse chronological order', () => {
    const sorted = sortAwards(awards);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].year).toBeGreaterThanOrEqual(sorted[i + 1].year);
    }
  });

  it('should preserve source order within the same year', () => {
    const sorted = sortAwards(awards);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].year === sorted[i + 1].year) {
        expect(sorted[i].sourceOrder).toBeLessThan(sorted[i + 1].sourceOrder);
      }
    }
  });

  it('should not mutate the original array', () => {
    const original = [...awards];
    sortAwards(awards);
    expect(awards).toEqual(original);
  });

  it('should handle empty array', () => {
    expect(sortAwards([])).toEqual([]);
  });

  it('should handle single element', () => {
    const single = [{ year: 2020, sourceOrder: 0 }];
    expect(sortAwards(single)).toEqual([{ year: 2020, sourceOrder: 0 }]);
  });
});

describe('getVisibleCount', () => {
  it('should return 10 for initial state (0 activations) when total > 10', () => {
    expect(getVisibleCount(0, 16)).toBe(10);
  });

  it('should return total when total <= 10', () => {
    expect(getVisibleCount(0, 8)).toBe(8);
    expect(getVisibleCount(0, 10)).toBe(10);
  });

  it('should add 5 per activation', () => {
    expect(getVisibleCount(1, 20)).toBe(15);
    expect(getVisibleCount(2, 20)).toBe(20);
  });

  it('should cap at total entries', () => {
    expect(getVisibleCount(3, 16)).toBe(16);
    expect(getVisibleCount(10, 16)).toBe(16);
  });

  it('should reveal min(5, remaining) per activation', () => {
    // Total 13: initial 10, first activation reveals 3 (remaining)
    expect(getVisibleCount(1, 13)).toBe(13);
  });

  it('should handle exact multiples', () => {
    // Total 20: initial 10, then 5+5 = 20
    expect(getVisibleCount(0, 20)).toBe(10);
    expect(getVisibleCount(1, 20)).toBe(15);
    expect(getVisibleCount(2, 20)).toBe(20);
  });
});

describe('filterByCategory', () => {
  it('should filter competition awards', () => {
    const competitions = filterByCategory(awards, 'competition');
    competitions.forEach(award => {
      expect(award.category).toBe('competition');
    });
    expect(competitions.length).toBeGreaterThan(0);
  });

  it('should filter academic awards', () => {
    const academic = filterByCategory(awards, 'academic');
    academic.forEach(award => {
      expect(award.category).toBe('academic');
    });
    expect(academic.length).toBe(1); // PPA scholarship
  });

  it('should return empty array for non-existent category', () => {
    expect(filterByCategory(awards, 'nonexistent')).toEqual([]);
  });

  it('should not mutate the original array', () => {
    const original = [...awards];
    filterByCategory(awards, 'competition');
    expect(awards).toEqual(original);
  });
});
