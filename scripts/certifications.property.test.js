import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatCertDate, isExpired } from './certifications.js';

describe('Property-Based Tests: Certification date formatting and classification', () => {
  /**
   * Property 3: Certification date formatting and classification
   *
   * For any certification with an expiration date, the display logic SHALL format
   * the date as "MMM YYYY"; certifications with null expiration SHALL display
   * "No Expiration"; certifications whose expiration date is before the current
   * date SHALL be classified as expired (distinct from valid certifications).
   *
   * **Validates: Requirements 5.1**
   */

  const MONTH_ABBREVS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  it('Property 3a: formatCertDate returns "MMM YYYY" for any valid Date', () => {
    const dateArbitrary = fc.date({
      min: new Date(1990, 0, 1),
      max: new Date(2099, 11, 31),
    });

    fc.assert(
      fc.property(dateArbitrary, (date) => {
        const result = formatCertDate(date);

        // Must match "MMM YYYY" format
        const parts = result.split(' ');
        expect(parts).toHaveLength(2);

        const [month, year] = parts;
        expect(MONTH_ABBREVS).toContain(month);
        expect(Number(year)).toBe(date.getFullYear());
        expect(MONTH_ABBREVS.indexOf(month)).toBe(date.getMonth());
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3b: formatCertDate returns "No Expiration" for null', () => {
    const result = formatCertDate(null);
    expect(result).toBe('No Expiration');
  });

  it('Property 3c: isExpired returns true for past dates, false for future dates and null', () => {
    // Generate dates that are clearly in the past (at least 1 day ago)
    const pastDateArbitrary = fc.date({
      min: new Date(1990, 0, 1),
      max: new Date(Date.now() - 86400000), // at least 1 day in the past
    });

    // Generate dates that are clearly in the future (at least 1 day ahead)
    const futureDateArbitrary = fc.date({
      min: new Date(Date.now() + 86400000), // at least 1 day in the future
      max: new Date(2099, 11, 31),
    });

    // Past dates should be classified as expired
    fc.assert(
      fc.property(pastDateArbitrary, (pastDate) => {
        const cert = { expirationDate: pastDate };
        expect(isExpired(cert)).toBe(true);
      }),
      { numRuns: 100 }
    );

    // Future dates should NOT be classified as expired
    fc.assert(
      fc.property(futureDateArbitrary, (futureDate) => {
        const cert = { expirationDate: futureDate };
        expect(isExpired(cert)).toBe(false);
      }),
      { numRuns: 100 }
    );

    // Null expiration should NOT be classified as expired
    const certNoExpiration = { expirationDate: null };
    expect(isExpired(certNoExpiration)).toBe(false);
  });
});
