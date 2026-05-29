import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getVisibleCount } from './awards.js';

/**
 * Property-based tests for Awards section logic.
 * Feature: personal-portfolio, Property 6: Progressive reveal pagination
 * **Validates: Requirements 6.6**
 */
describe('Property 6: Progressive reveal pagination', () => {
  it('initial display is exactly 10 for any total > 10', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 11, max: 10000 }),
        (total) => {
          expect(getVisibleCount(0, total)).toBe(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each activation reveals min(5, remaining) until all N visible', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 11, max: 10000 }),
        (total) => {
          let previousVisible = getVisibleCount(0, total);
          expect(previousVisible).toBe(10);

          let activations = 1;
          while (previousVisible < total) {
            const currentVisible = getVisibleCount(activations, total);
            const revealed = currentVisible - previousVisible;
            const remaining = total - previousVisible;
            const expectedReveal = Math.min(5, remaining);

            // Each activation reveals exactly min(5, remaining)
            expect(revealed).toBe(expectedReveal);

            // Visible count never exceeds total
            expect(currentVisible).toBeLessThanOrEqual(total);

            previousVisible = currentVisible;
            activations++;
          }

          // After enough activations, all entries are visible
          expect(previousVisible).toBe(total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('visible count never exceeds total for any number of activations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 11, max: 10000 }),
        fc.integer({ min: 0, max: 5000 }),
        (total, activations) => {
          const visible = getVisibleCount(activations, total);
          expect(visible).toBeLessThanOrEqual(total);
          expect(visible).toBeGreaterThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('visible count is monotonically non-decreasing with activations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 11, max: 10000 }),
        fc.integer({ min: 0, max: 1000 }),
        (total, activations) => {
          const current = getVisibleCount(activations, total);
          const next = getVisibleCount(activations + 1, total);
          expect(next).toBeGreaterThanOrEqual(current);
        }
      ),
      { numRuns: 100 }
    );
  });
});
