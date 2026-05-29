import { describe, it, expect } from 'vitest';
import { calculateDuration, formatDateRange, sortRoles } from './utils.js';

describe('calculateDuration', () => {
  it('returns "X mos" when total months < 12', () => {
    const start = new Date(2023, 0); // Jan 2023
    const end = new Date(2023, 5);   // Jun 2023
    // Jan to Jun = 5 complete months difference
    expect(calculateDuration(start, end)).toBe('5 mos');
  });

  it('returns "X yrs Y mos" when total months >= 12', () => {
    const start = new Date(2022, 0); // Jan 2022
    const end = new Date(2024, 11);  // Dec 2024
    expect(calculateDuration(start, end)).toBe('2 yrs 11 mos');
  });

  it('returns "X yrs 0 mos" when months is exactly divisible by 12', () => {
    const start = new Date(2022, 0); // Jan 2022
    const end = new Date(2024, 0);   // Jan 2024
    expect(calculateDuration(start, end)).toBe('2 yrs 0 mos');
  });

  it('returns "0 mos" when start and end are the same month', () => {
    const start = new Date(2023, 5); // Jun 2023
    const end = new Date(2023, 5);   // Jun 2023
    expect(calculateDuration(start, end)).toBe('0 mos');
  });

  it('uses current date when endDate is null', () => {
    const start = new Date(2020, 0); // Jan 2020
    const result = calculateDuration(start, null);
    // Should contain "yrs" since it's been more than 12 months from Jan 2020
    expect(result).toMatch(/\d+ yrs \d+ mos/);
  });
});

describe('formatDateRange', () => {
  it('formats a complete date range', () => {
    const start = new Date(2022, 0); // Jan 2022
    const end = new Date(2024, 11);  // Dec 2024
    expect(formatDateRange(start, end)).toBe('Jan 2022 – Dec 2024');
  });

  it('formats with "Present" when endDate is null', () => {
    const start = new Date(2022, 0); // Jan 2022
    expect(formatDateRange(start, null)).toBe('Jan 2022 – Present');
  });

  it('formats all month abbreviations correctly', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((name, index) => {
      const date = new Date(2023, index);
      const result = formatDateRange(date, date);
      expect(result).toBe(`${name} 2023 – ${name} 2023`);
    });
  });
});

describe('sortRoles', () => {
  it('sorts roles by startDate descending (most recent first)', () => {
    const roles = [
      { company: 'A', startDate: new Date(2020, 0) },
      { company: 'C', startDate: new Date(2023, 6) },
      { company: 'B', startDate: new Date(2021, 3) },
    ];
    const sorted = sortRoles(roles);
    expect(sorted[0].company).toBe('C');
    expect(sorted[1].company).toBe('B');
    expect(sorted[2].company).toBe('A');
  });

  it('does not mutate the original array', () => {
    const roles = [
      { company: 'A', startDate: new Date(2020, 0) },
      { company: 'B', startDate: new Date(2023, 0) },
    ];
    const original = [...roles];
    sortRoles(roles);
    expect(roles).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortRoles([])).toEqual([]);
  });

  it('handles single element', () => {
    const roles = [{ company: 'A', startDate: new Date(2023, 0) }];
    expect(sortRoles(roles)).toEqual(roles);
  });
});
