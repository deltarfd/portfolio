/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Interaction Tests for main.js behaviors
 *
 * Tests the DOM interactions implemented in the IIFE:
 * - Mobile nav toggle expand/collapse
 * - Smooth scroll activation on nav link click
 * - Scroll-spy active link updates
 * - Certifications expand/collapse
 * - Awards progressive reveal
 *
 * Validates: Requirements 2.2, 2.4, 2.5, 2.6, 5.3, 6.6
 */

// Read main.js source once — we'll eval it in each test's DOM context
const mainJsPath = resolve(__dirname, 'main.js');
const mainJsSource = readFileSync(mainJsPath, 'utf-8');

/**
 * Helper: builds a minimal DOM matching the portfolio HTML structure,
 * then executes main.js to attach event listeners.
 */
function setupDOM() {
  document.body.innerHTML = `
    <header class="nav-edge" role="banner">
      <nav aria-label="Primary navigation" role="navigation">
        <a href="#hero" class="nav-wordmark">DELTA</a>
        <ul class="nav-links" id="nav-links" role="list">
          <li><a href="#hero" class="nav-link" data-section="hero">Hero</a></li>
          <li><a href="#experience" class="nav-link" data-section="experience">Experience</a></li>
          <li><a href="#skills" class="nav-link" data-section="skills">Skills</a></li>
          <li><a href="#certifications" class="nav-link" data-section="certifications">Certifications</a></li>
          <li><a href="#awards" class="nav-link" data-section="awards">Awards</a></li>
          <li><a href="#contact" class="nav-link" data-section="contact">Contact</a></li>
        </ul>
        <button
          class="nav-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="nav-overlay"
          aria-label="Open navigation menu"
        >
          <span class="nav-toggle__bar"></span>
        </button>
        <div class="nav-overlay" id="nav-overlay" aria-hidden="true">
          <ul class="nav-overlay__links" role="list">
            <li><a href="#hero" class="nav-overlay__link" data-section="hero">Hero</a></li>
            <li><a href="#experience" class="nav-overlay__link" data-section="experience">Experience</a></li>
            <li><a href="#skills" class="nav-overlay__link" data-section="skills">Skills</a></li>
            <li><a href="#certifications" class="nav-overlay__link" data-section="certifications">Certifications</a></li>
            <li><a href="#awards" class="nav-overlay__link" data-section="awards">Awards</a></li>
            <li><a href="#contact" class="nav-overlay__link" data-section="contact">Contact</a></li>
          </ul>
        </div>
      </nav>
    </header>
    <main id="main-content">
      <section id="hero" aria-label="Introduction" class="hero">
        <h1>Delta Rahmat Fajar Delviansyah</h1>
      </section>
      <section id="experience" aria-label="Professional experience">
        <h2>Experience</h2>
      </section>
      <section id="skills" aria-label="Technical skills">
        <h2>Skills</h2>
      </section>
      <section id="certifications" aria-label="Certifications">
        <div class="cert-list">
          <article class="cert-entry cert-entry--key">Cert 1</article>
          <article class="cert-entry cert-entry--key">Cert 2</article>
          <article class="cert-entry cert-entry--key">Cert 3</article>
          <article class="cert-entry cert-entry--key">Cert 4</article>
          <article class="cert-entry cert-entry--key">Cert 5</article>
          <article class="cert-entry cert-entry--key">Cert 6</article>
          <div class="cert-hidden" id="cert-hidden">
            <article class="cert-entry">Cert 7</article>
            <article class="cert-entry">Cert 8</article>
          </div>
        </div>
        <button type="button" class="expand-btn" id="cert-expand-btn" aria-expanded="false" aria-controls="cert-hidden">Show all 43</button>
      </section>
      <section id="awards" aria-label="Awards and honors">
        <div class="awards-group" data-category="competition">
          <ol class="awards-list" aria-label="Competition awards">
            ${Array.from({ length: 13 }, (_, i) => `<li class="award-entry"${i >= 10 ? ' hidden' : ''}><span class="award-entry__year">${2023 - Math.floor(i / 3)}</span><p class="award-entry__title">Award ${i + 1}</p></li>`).join('\n            ')}
          </ol>
        </div>
        <div class="awards-group" data-category="academic">
          <ol class="awards-list" aria-label="Academic honors">
            ${Array.from({ length: 3 }, (_, i) => `<li class="award-entry"${(10 + i) >= 10 ? ' hidden' : ''}><span class="award-entry__year">${2020 - i}</span><p class="award-entry__title">PPA ${2020 - i}</p></li>`).join('\n            ')}
          </ol>
        </div>
        <button class="expand-btn awards-show-more" type="button" aria-expanded="false" aria-label="Show more awards" data-awards-toggle>Show more</button>
      </section>
      <section id="contact" aria-label="Contact">
        <h2>Contact</h2>
      </section>
    </main>
  `;
}

/**
 * Sets up browser API mocks and executes main.js in the current DOM context.
 * @param {{ reducedMotion?: boolean }} options
 */
function initMainJS({ reducedMotion = false } = {}) {
  // Mock IntersectionObserver
  const observers = [];
  global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => {
    const observer = {
      callback,
      options,
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    observers.push(observer);
    return observer;
  });

  // Mock scrollIntoView on all elements
  Element.prototype.scrollIntoView = vi.fn();

  // Mock matchMedia for prefers-reduced-motion
  window.matchMedia = vi.fn().mockReturnValue({ matches: reducedMotion });

  // Execute main.js IIFE in the current context
  // eslint-disable-next-line no-eval
  const fn = new Function(mainJsSource);
  fn();

  return observers;
}

describe('Mobile nav toggle expand/collapse', () => {
  beforeEach(() => {
    setupDOM();
    initMainJS();
  });

  it('opens overlay on toggle click — adds is-open class and updates aria', () => {
    const toggle = document.querySelector('.nav-toggle');
    const overlay = document.getElementById('nav-overlay');

    toggle.click();

    expect(overlay.classList.contains('is-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(overlay.getAttribute('aria-hidden')).toBe('false');
  });

  it('closes overlay on second toggle click', () => {
    const toggle = document.querySelector('.nav-toggle');
    const overlay = document.getElementById('nav-overlay');

    // Open
    toggle.click();
    // Close
    toggle.click();

    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });

  it('updates aria-label when opening and closing', () => {
    const toggle = document.querySelector('.nav-toggle');

    toggle.click();
    expect(toggle.getAttribute('aria-label')).toBe('Close navigation menu');

    toggle.click();
    expect(toggle.getAttribute('aria-label')).toBe('Open navigation menu');
  });

  it('prevents body scroll when overlay is open', () => {
    const toggle = document.querySelector('.nav-toggle');

    toggle.click();
    expect(document.body.style.overflow).toBe('hidden');

    toggle.click();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes overlay on Escape key press', () => {
    const toggle = document.querySelector('.nav-toggle');
    const overlay = document.getElementById('nav-overlay');

    toggle.click();
    expect(overlay.classList.contains('is-open')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Smooth scroll activation on nav link click', () => {
  beforeEach(() => {
    setupDOM();
    initMainJS();
  });

  it('calls scrollIntoView with smooth behavior on nav link click', () => {
    const link = document.querySelector('.nav-link[data-section="experience"]');
    const target = document.getElementById('experience');

    link.click();

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('calls scrollIntoView with instant behavior when prefers-reduced-motion is set', () => {
    // Reset and reload with reduced motion preference
    setupDOM();
    initMainJS({ reducedMotion: true });

    const link = document.querySelector('.nav-link[data-section="experience"]');
    const target = document.getElementById('experience');

    link.click();

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('prevents default link behavior on click', () => {
    const link = document.querySelector('.nav-link[data-section="skills"]');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const prevented = !link.dispatchEvent(event);

    // The event should be prevented (scrollIntoView is used instead)
    expect(prevented).toBe(true);
  });

  it('closes mobile nav overlay after clicking an overlay link', () => {
    const toggle = document.querySelector('.nav-toggle');
    const overlay = document.getElementById('nav-overlay');
    const overlayLink = document.querySelector('.nav-overlay__link[data-section="contact"]');

    // Open mobile nav
    toggle.click();
    expect(overlay.classList.contains('is-open')).toBe(true);

    // Click overlay link
    overlayLink.click();

    expect(overlay.classList.contains('is-open')).toBe(false);
  });
});

describe('Scroll-spy active link updates', () => {
  let observers;

  beforeEach(() => {
    setupDOM();
    observers = initMainJS();
  });

  it('adds is-active class to the nav link matching the visible section', () => {
    const experienceSection = document.getElementById('experience');

    // Mock getBoundingClientRect for the section
    experienceSection.getBoundingClientRect = () => ({ top: 50 });

    // Find the scroll-spy observer (first one created with rootMargin containing %)
    const scrollSpyObserver = observers.find(
      o => o.options && o.options.rootMargin && o.options.rootMargin.includes('%')
    );

    // Simulate IntersectionObserver firing for experience section
    scrollSpyObserver.callback([
      {
        target: experienceSection,
        isIntersecting: true,
      },
    ]);

    const activeLinks = document.querySelectorAll('.nav-link.is-active, .nav-overlay__link.is-active');
    const activeDataSections = Array.from(activeLinks).map(l => l.getAttribute('data-section'));
    expect(activeDataSections).toContain('experience');
  });

  it('removes is-active from previously active link when a new section becomes visible', () => {
    const heroSection = document.getElementById('hero');
    const skillsSection = document.getElementById('skills');

    const scrollSpyObserver = observers.find(
      o => o.options && o.options.rootMargin && o.options.rootMargin.includes('%')
    );

    // First, hero is visible
    heroSection.getBoundingClientRect = () => ({ top: 0 });
    scrollSpyObserver.callback([
      { target: heroSection, isIntersecting: true },
    ]);

    // Verify hero is active
    let heroLinks = document.querySelectorAll('[data-section="hero"].is-active');
    expect(heroLinks.length).toBeGreaterThan(0);

    // Then skills becomes the topmost, hero leaves
    heroSection.getBoundingClientRect = () => ({ top: -500 });
    skillsSection.getBoundingClientRect = () => ({ top: 10 });
    scrollSpyObserver.callback([
      { target: heroSection, isIntersecting: false },
      { target: skillsSection, isIntersecting: true },
    ]);

    heroLinks = document.querySelectorAll('[data-section="hero"].is-active');
    const skillsLinks = document.querySelectorAll('[data-section="skills"].is-active');

    expect(heroLinks.length).toBe(0);
    expect(skillsLinks.length).toBeGreaterThan(0);
  });
});

describe('Certifications expand/collapse', () => {
  beforeEach(() => {
    setupDOM();
    initMainJS();
  });

  it('adds is-visible class to hidden container on button click', () => {
    const btn = document.getElementById('cert-expand-btn');
    const hidden = document.getElementById('cert-hidden');

    btn.click();

    expect(hidden.classList.contains('is-visible')).toBe(true);
  });

  it('sets aria-expanded to true on button click', () => {
    const btn = document.getElementById('cert-expand-btn');

    btn.click();

    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('hides the expand button after click', () => {
    const btn = document.getElementById('cert-expand-btn');

    btn.click();

    expect(btn.style.display).toBe('none');
  });
});

describe('Awards progressive reveal', () => {
  beforeEach(() => {
    setupDOM();
    initMainJS();
  });

  it('initially shows first 10 entries and hides the rest', () => {
    const entries = document.querySelectorAll('#awards .award-entry');
    let visibleCount = 0;
    let hiddenCount = 0;

    entries.forEach((entry) => {
      if (entry.hasAttribute('hidden')) {
        hiddenCount++;
      } else {
        visibleCount++;
      }
    });

    expect(visibleCount).toBe(10);
    expect(hiddenCount).toBe(6); // 16 total - 10 visible = 6 hidden
  });

  it('reveals 5 more entries on first Show more click', () => {
    const btn = document.querySelector('[data-awards-toggle]');

    btn.click();

    const entries = document.querySelectorAll('#awards .award-entry');
    let visibleCount = 0;
    entries.forEach((entry) => {
      if (!entry.hasAttribute('hidden')) {
        visibleCount++;
      }
    });

    expect(visibleCount).toBe(15);
  });

  it('reveals all remaining entries on second click and hides button', () => {
    const btn = document.querySelector('[data-awards-toggle]');

    // First click: 10 → 15
    btn.click();
    // Second click: 15 → 16 (all)
    btn.click();

    const entries = document.querySelectorAll('#awards .award-entry');
    let visibleCount = 0;
    entries.forEach((entry) => {
      if (!entry.hasAttribute('hidden')) {
        visibleCount++;
      }
    });

    expect(visibleCount).toBe(16);
    expect(btn.hasAttribute('hidden')).toBe(true);
  });

  it('sets aria-expanded to true when all entries are revealed', () => {
    const btn = document.querySelector('[data-awards-toggle]');

    btn.click(); // 15 visible
    btn.click(); // 16 visible (all)

    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});
