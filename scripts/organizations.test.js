import { describe, it, expect } from 'vitest';
import { sortOrganizations, formatOrgDateRange, organizationData } from './organizations.js';

describe('sortOrganizations', () => {
  it('sorts by most recent start date first', () => {
    const orgs = [
      { organization: 'Org A', role: 'Role A', startDate: new Date(2017, 0), endDate: new Date(2018, 0) },
      { organization: 'Org B', role: 'Role B', startDate: new Date(2022, 0), endDate: null },
      { organization: 'Org C', role: 'Role C', startDate: new Date(2019, 5), endDate: new Date(2020, 5) },
    ];

    const sorted = sortOrganizations(orgs);

    expect(sorted[0].organization).toBe('Org B');
    expect(sorted[1].organization).toBe('Org C');
    expect(sorted[2].organization).toBe('Org A');
  });

  it('uses alphabetical tiebreaker for same start date', () => {
    const orgs = [
      { organization: 'Zebra Org', role: 'Role Z', startDate: new Date(2020, 3), endDate: null },
      { organization: 'Alpha Org', role: 'Role A', startDate: new Date(2020, 3), endDate: null },
      { organization: 'Middle Org', role: 'Role M', startDate: new Date(2020, 3), endDate: null },
    ];

    const sorted = sortOrganizations(orgs);

    expect(sorted[0].organization).toBe('Alpha Org');
    expect(sorted[1].organization).toBe('Middle Org');
    expect(sorted[2].organization).toBe('Zebra Org');
  });

  it('does not mutate the original array', () => {
    const orgs = [
      { organization: 'Org B', role: 'Role B', startDate: new Date(2020, 0), endDate: null },
      { organization: 'Org A', role: 'Role A', startDate: new Date(2022, 0), endDate: null },
    ];

    const original = [...orgs];
    sortOrganizations(orgs);

    expect(orgs).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortOrganizations([])).toEqual([]);
  });

  it('handles single element', () => {
    const orgs = [{ organization: 'Solo', role: 'Role', startDate: new Date(2021, 0), endDate: null }];
    const sorted = sortOrganizations(orgs);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].organization).toBe('Solo');
  });

  it('correctly sorts the actual organization data', () => {
    const sorted = sortOrganizations(organizationData);

    expect(sorted[0].organization).toBe('Ikatan Alumni POLBAN (Politeknik ITB)');
    expect(sorted[1].organization).toBe('Himpunan Mahasiswa Komputer, POLBAN');
    expect(sorted[1].role).toBe('Head of Encode Network & Security');
    expect(sorted[2].organization).toBe('Himpunan Mahasiswa Komputer, POLBAN');
    expect(sorted[2].role).toBe('Communication & Information Department Staff');
  });
});

describe('formatOrgDateRange', () => {
  it('formats a complete date range', () => {
    const result = formatOrgDateRange(new Date(2018, 8), new Date(2019, 8));
    expect(result).toBe('Sep 2018 – Sep 2019');
  });

  it('formats an ongoing role with null endDate', () => {
    const result = formatOrgDateRange(new Date(2022, 0), null);
    expect(result).toBe('Jan 2022 – Present');
  });
});
