import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortOrganizations } from './organizations.js';

describe('Property-Based Tests: sortOrganizations', () => {
  /**
   * Property 7: Organization entries sort order
   *
   * For any list of organization roles, the sort function SHALL produce an ordering where:
   * (a) entries are sorted by start date descending (most recent first), and
   * (b) when two entries share the same start date, they are ordered alphabetically
   *     by organization name.
   *
   * **Validates: Requirements 13.1, 13.4**
   */
  it('Property 7: sorted organizations are ordered by startDate descending, with alphabetical tiebreaker on organization name', () => {
    const orgRoleArbitrary = fc.record({
      organization: fc.string({ minLength: 1, maxLength: 80 }),
      role: fc.string({ minLength: 1, maxLength: 80 }),
      startDate: fc.date({
        min: new Date(1990, 0, 1),
        max: new Date(2030, 11, 31),
      }),
      endDate: fc.oneof(
        fc.constant(null),
        fc.date({ min: new Date(1990, 0, 1), max: new Date(2030, 11, 31) })
      ),
    });

    fc.assert(
      fc.property(fc.array(orgRoleArbitrary, { minLength: 0, maxLength: 20 }), (orgs) => {
        const sorted = sortOrganizations(orgs);

        // The sorted array should have the same length as the input
        expect(sorted.length).toBe(orgs.length);

        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];

          const currentTime = current.startDate.getTime();
          const nextTime = next.startDate.getTime();

          // (a) Sorted by start date descending (most recent first)
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);

          // (b) Same start date: sorted alphabetically by organization name
          if (currentTime === nextTime) {
            expect(current.organization.localeCompare(next.organization)).toBeLessThanOrEqual(0);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
