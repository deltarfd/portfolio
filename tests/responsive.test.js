import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Responsive Layout Tests
 * Validates: Requirements 9.1, 9.2, 9.3, 9.5
 *
 * Since this is a static site without a browser runtime, these tests verify
 * that the CSS rules necessary for responsive behavior are correctly defined
 * by parsing the CSS files as text.
 */

const stylesDir = resolve(import.meta.dirname, '..', 'styles');
const layoutCSS = readFileSync(resolve(stylesDir, 'layout.css'), 'utf-8');
const componentsCSS = readFileSync(resolve(stylesDir, 'components.css'), 'utf-8');
const tokensCSS = readFileSync(resolve(stylesDir, 'tokens.css'), 'utf-8');
const allCSS = layoutCSS + componentsCSS + tokensCSS;

describe('Responsive Layout — No Horizontal Scrolling (Req 9.1)', () => {
  it('declares overflow-x: clip on html element', () => {
    // Match html selector with overflow-x: clip
    const htmlBlock = layoutCSS.match(/html\s*\{[^}]*\}/s);
    expect(htmlBlock).not.toBeNull();
    expect(htmlBlock[0]).toMatch(/overflow-x\s*:\s*clip/);
  });

  it('declares overflow-x: clip on body element', () => {
    // Match body selector with overflow-x: clip
    const bodyBlocks = layoutCSS.match(/body\s*\{[^}]*\}/gs);
    expect(bodyBlocks).not.toBeNull();
    const hasOverflowClip = bodyBlocks.some(block => /overflow-x\s*:\s*clip/.test(block));
    expect(hasOverflowClip).toBe(true);
  });

  it('constrains images to max-width: 100%', () => {
    // img should have max-width: 100%
    expect(layoutCSS).toMatch(/img[\s\S]*?\{[^}]*max-width\s*:\s*100%/);
  });

  it('uses overflow-wrap: anywhere for narrow viewports', () => {
    expect(layoutCSS).toMatch(/overflow-wrap\s*:\s*anywhere/);
  });
});

describe('Responsive Layout — Single Column Below 768px (Req 9.2)', () => {
  it('main is a single centered content column (block, max-width capped)', () => {
    // The page uses a single centered column; sibling blocks never sit side by side.
    const mainBlock = layoutCSS.match(/main\s*\{[^}]*\}/s);
    expect(mainBlock).not.toBeNull();
    expect(mainBlock[0]).toMatch(/max-width\s*:/);
    expect(mainBlock[0]).toMatch(/margin-inline\s*:\s*auto/);
  });

  it('sections stack vertically as block-level children (no side-by-side siblings)', () => {
    // main > section relies on vertical padding for rhythm; nothing forces a row.
    const sectionRule = layoutCSS.match(/main\s*>\s*section\s*\{[^}]*\}/s);
    expect(sectionRule).not.toBeNull();
    // Must NOT introduce a multi-column row at the section level
    expect(sectionRule[0]).not.toMatch(/grid-template-columns\s*:\s*[^;]*\s+[^;]+/);
  });

  it('any two-column layouts (hero) only activate at the 768px breakpoint', () => {
    // The hero is single-column on mobile and only becomes two-column at >=768px.
    const tabletMedia = (layoutCSS + componentsCSS).match(
      /@media\s*\(\s*min-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\n\}/g
    );
    expect(tabletMedia).not.toBeNull();
    const introducesColumns = tabletMedia.some(block =>
      /grid-template-columns\s*:/.test(block)
    );
    expect(introducesColumns).toBe(true);
  });
});

describe('Responsive Layout — Minimum Font Sizes (Req 9.3)', () => {
  it('body font-size uses clamp() with minimum of 1rem (16px)', () => {
    // body font-size should use clamp with min of at least 1rem
    const bodyBlocks = layoutCSS.match(/body\s*\{[^}]*\}/gs);
    expect(bodyBlocks).not.toBeNull();
    const hasFontClamp = bodyBlocks.some(block =>
      /font-size\s*:\s*clamp\(\s*1rem/.test(block)
    );
    expect(hasFontClamp).toBe(true);
  });

  it('h1 font-size uses clamp() with minimum of at least 2rem (32px)', () => {
    const h1Block = layoutCSS.match(/h1\s*\{[^}]*\}/s);
    expect(h1Block).not.toBeNull();
    // Extract the clamp() minimum (first arg) and assert it's >= 2rem
    const min = h1Block[0].match(/font-size\s*:\s*clamp\(\s*([\d.]+)rem/);
    expect(min).not.toBeNull();
    expect(parseFloat(min[1])).toBeGreaterThanOrEqual(2);
  });

  it('h2 font-size uses clamp() with minimum of at least 1.5rem (24px)', () => {
    const h2Block = layoutCSS.match(/h2\s*\{[^}]*\}/s);
    expect(h2Block).not.toBeNull();
    expect(h2Block[0]).toMatch(/font-size\s*:\s*clamp\(\s*1\.5rem/);
  });

  it('h3 font-size uses clamp() with minimum of at least 1.25rem (20px)', () => {
    const h3Block = layoutCSS.match(/h3\s*\{[^}]*\}/s);
    expect(h3Block).not.toBeNull();
    expect(h3Block[0]).toMatch(/font-size\s*:\s*clamp\(\s*1\.25rem/);
  });
});

describe('Responsive Layout — 44×44px Tap Targets on Mobile (Req 9.5)', () => {
  it('defines min-height: 44px for interactive elements below 768px', () => {
    // Should have a max-width: 767px media query with min-height: 44px
    const mobileMedia = allCSS.match(/@media\s*\(\s*max-width\s*:\s*767px\s*\)\s*\{[\s\S]*?\n\}/g);
    expect(mobileMedia).not.toBeNull();
    const hasMinHeight = mobileMedia.some(block => /min-height\s*:\s*44px/.test(block));
    expect(hasMinHeight).toBe(true);
  });

  it('defines min-width: 44px for interactive elements below 768px', () => {
    const mobileMedia = allCSS.match(/@media\s*\(\s*max-width\s*:\s*767px\s*\)\s*\{[\s\S]*?\n\}/g);
    expect(mobileMedia).not.toBeNull();
    const hasMinWidth = mobileMedia.some(block => /min-width\s*:\s*44px/.test(block));
    expect(hasMinWidth).toBe(true);
  });

  it('targets buttons, links, and inputs for tap target sizing', () => {
    const mobileMedia = allCSS.match(/@media\s*\(\s*max-width\s*:\s*767px\s*\)\s*\{[\s\S]*?\n\}/g);
    expect(mobileMedia).not.toBeNull();
    const mobileBlock = mobileMedia.join('\n');
    // Should target common interactive elements
    expect(mobileBlock).toMatch(/\ba\b/);
    expect(mobileBlock).toMatch(/\bbutton\b/);
  });
});

describe('Responsive Layout — Media Query Breakpoints', () => {
  it('has a media query at 768px (tablet breakpoint)', () => {
    expect(layoutCSS).toMatch(/@media\s*\(\s*min-width\s*:\s*768px\s*\)/);
  });

  it('has a media query at 1024px (desktop breakpoint)', () => {
    expect(layoutCSS).toMatch(/@media\s*\(\s*min-width\s*:\s*1024px\s*\)/);
  });

  it('chip-list uses flex-wrap: wrap to prevent horizontal overflow', () => {
    expect(allCSS).toMatch(/\.chip-list[\s\S]*?\{[^}]*flex-wrap\s*:\s*wrap/);
  });
});

describe('Responsive Layout — Smooth Scroll and Reduced Motion', () => {
  it('declares scroll-behavior: smooth on html', () => {
    const htmlBlock = layoutCSS.match(/html\s*\{[^}]*\}/s);
    expect(htmlBlock).not.toBeNull();
    expect(htmlBlock[0]).toMatch(/scroll-behavior\s*:\s*smooth/);
  });

  it('has @media (prefers-reduced-motion: reduce) rule', () => {
    expect(allCSS).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });

  it('disables smooth scroll in reduced motion mode', () => {
    const reducedMotionBlocks = allCSS.match(
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\n\}/g
    );
    expect(reducedMotionBlocks).not.toBeNull();
    const disablesScroll = reducedMotionBlocks.some(block =>
      /scroll-behavior\s*:\s*auto/.test(block)
    );
    expect(disablesScroll).toBe(true);
  });
});
