import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';
import { getBuiltHtml } from './buildHtml.js';

let document;
let window;
let dom;

beforeAll(() => {
  const html = getBuiltHtml();
  dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });
  document = dom.window.document;
  window = dom.window;
});

describe('axe-core WCAG AA Compliance', () => {
  it('passes axe-core accessibility checks', async () => {
    // Load axe-core source into the jsdom window so it has proper context
    const axeSource = readFileSync(
      resolve(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'),
      'utf-8'
    );
    dom.window.eval(axeSource);

    const results = await dom.window.axe.run(document.documentElement, {
      rules: {
        // Disable rules that require visual rendering (not available in jsdom)
        'color-contrast': { enabled: false },
      },
      // Target WCAG 2.1 AA
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
    });

    // Format violations for readable output
    const violations = results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
      help: v.help,
    }));

    expect(violations).toEqual([]);
  }, 30000);
});
