import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortRoles } from './utils.js';

describe('Property-Based Tests: sortRoles', () => {
  /**
   * Property 2: Experience roles reverse-chronological ordering
   *
   * For any list of Role objects with valid start dates, the sortRoles function
   * SHALL return a list where for every adjacent pair (role[i], role[i+1]),
   * role[i].startDate >= role[i+1].startDate (most recent first).
   *
   * **Validates: Requirements 3.2**
   */
  it('Property 2: sorted roles are in reverse-chronological order by startDate', () => {
    const roleArbitrary = fc.record({
      company: fc.string({ minLength: 1, maxLength: 50 }),
      title: fc.string({ minLength: 1, maxLength: 50 }),
      startDate: fc.date({
        min: new Date(1990, 0, 1),
        max: new Date(2030, 11, 31),
      }),
    });

    fc.assert(
      fc.property(fc.array(roleArbitrary, { minLength: 0, maxLength: 20 }), (roles) => {
        const sorted = sortRoles(roles);

        // For every adjacent pair, role[i].startDate >= role[i+1].startDate
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].startDate.getTime()).toBeGreaterThanOrEqual(
            sorted[i + 1].startDate.getTime()
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
