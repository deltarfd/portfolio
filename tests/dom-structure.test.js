import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { getBuiltHtml } from './buildHtml.js';

let document;

beforeAll(() => {
  const html = getBuiltHtml();
  const dom = new JSDOM(html, { url: 'http://localhost' });
  document = dom.window.document;
});

describe('Profile Section', () => {
  it('contains an h1 with the full name', () => {
    const h1 = document.querySelector('#profile h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toBe('Delta Rahmat Fajar Delviansyah');
  });

  it('contains a professional title as h2', () => {
    const h2 = document.querySelector('#profile h2');
    expect(h2).not.toBeNull();
    expect(h2.textContent).toBe('Tech Enthusiast | Mobile Developer / Engineer');
  });

  it('contains a professional summary paragraph', () => {
    const summary = document.querySelector('#profile .profile__summary');
    expect(summary).not.toBeNull();
    expect(summary.textContent.length).toBeLessThanOrEqual(280);
    expect(summary.textContent).toMatch(/\d+/); // contains numeric value
  });

  it('has an aria-label on the section', () => {
    const section = document.querySelector('#profile');
    expect(section.getAttribute('aria-label')).toBeTruthy();
  });
});

describe('Navigation', () => {
  it('contains a nav element with aria-label', () => {
    const nav = document.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.getAttribute('aria-label')).toBe('Primary navigation');
  });

  it('has links to all 9 sections', () => {
    const expectedSections = [
      'profile', 'experience', 'projects', 'skills', 'certifications',
      'awards', 'education', 'organizations', 'contact'
    ];
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    const linkSections = Array.from(navLinks).map(link => link.getAttribute('data-section'));
    expect(linkSections).toEqual(expectedSections);
  });

  it('has a mobile toggle button with aria-expanded', () => {
    const toggle = document.querySelector('.nav-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe('nav-overlay');
    expect(toggle.getAttribute('aria-label')).toBeTruthy();
  });

  it('has a mobile overlay with all section links', () => {
    const overlayLinks = document.querySelectorAll('.nav-overlay__link');
    expect(overlayLinks.length).toBe(9);
  });
});

describe('Section Order', () => {
  it('sections appear in the correct DOM order', () => {
    const main = document.querySelector('main');
    const sections = Array.from(main.querySelectorAll(':scope > section'));
    const sectionIds = sections.map(s => s.id);
    expect(sectionIds).toEqual([
      'profile', 'experience', 'projects', 'skills', 'certifications',
      'awards', 'education', 'organizations', 'contact'
    ]);
  });

  it('profile is the first section', () => {
    const main = document.querySelector('main');
    const firstSection = main.querySelector(':scope > section');
    expect(firstSection.id).toBe('profile');
  });

  it('contact is the last section before footer', () => {
    const main = document.querySelector('main');
    const sections = main.querySelectorAll(':scope > section');
    const lastSection = sections[sections.length - 1];
    expect(lastSection.id).toBe('contact');
  });
});

describe('Social Links', () => {
  it('has a mailto link for email', () => {
    const emailLink = document.querySelector('a[href="mailto:deltarfd@live.com"]');
    expect(emailLink).not.toBeNull();
    expect(emailLink.getAttribute('aria-label')).toBeTruthy();
  });

  it('has a LinkedIn link with correct attributes', () => {
    const linkedinLink = document.querySelector('a[href="https://linkedin.com/in/deltarfd"]');
    expect(linkedinLink).not.toBeNull();
    expect(linkedinLink.getAttribute('target')).toBe('_blank');
    expect(linkedinLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(linkedinLink.getAttribute('aria-label')).toBeTruthy();
  });

  it('has a GitHub link with correct attributes', () => {
    const githubLink = document.querySelector('a[href="https://github.com/deltarfd"]');
    expect(githubLink).not.toBeNull();
    expect(githubLink.getAttribute('target')).toBe('_blank');
    expect(githubLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(githubLink.getAttribute('aria-label')).toBeTruthy();
  });
});

describe('Semantic HTML Structure', () => {
  it('has a header element', () => {
    expect(document.querySelector('header')).not.toBeNull();
  });

  it('has a nav element', () => {
    expect(document.querySelector('nav')).not.toBeNull();
  });

  it('has a main element', () => {
    expect(document.querySelector('main')).not.toBeNull();
  });

  it('has section elements for content areas', () => {
    const sections = document.querySelectorAll('main section');
    expect(sections.length).toBe(9);
  });

  it('has a footer element', () => {
    expect(document.querySelector('footer')).not.toBeNull();
  });

  it('header has role="banner"', () => {
    const header = document.querySelector('header');
    expect(header.getAttribute('role')).toBe('banner');
  });

  it('footer has role="contentinfo"', () => {
    const footer = document.querySelector('footer');
    expect(footer.getAttribute('role')).toBe('contentinfo');
  });

  it('nav has role="navigation"', () => {
    const nav = document.querySelector('nav');
    expect(nav.getAttribute('role')).toBe('navigation');
  });
});

describe('ARIA Attributes', () => {
  it('all content sections have aria-label', () => {
    const sections = document.querySelectorAll('main section');
    sections.forEach(section => {
      expect(section.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('toggle buttons have aria-expanded', () => {
    const toggleButtons = document.querySelectorAll('button[aria-expanded]');
    expect(toggleButtons.length).toBeGreaterThan(0);
    toggleButtons.forEach(btn => {
      const expanded = btn.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(expanded);
    });
  });

  it('expand buttons have aria-controls', () => {
    const navToggle = document.querySelector('.nav-toggle');
    expect(navToggle.getAttribute('aria-controls')).toBeTruthy();

    const certExpand = document.querySelector('#cert-expand-btn');
    expect(certExpand.getAttribute('aria-controls')).toBeTruthy();
  });
});

describe('Skip-to-Content Link', () => {
  it('has a skip-to-content link as first focusable element', () => {
    const skipLink = document.querySelector('.skip-link');
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(skipLink.textContent.toLowerCase()).toContain('skip');
  });

  it('skip link target exists', () => {
    const target = document.querySelector('#main-content');
    expect(target).not.toBeNull();
  });
});

describe('Tab Order and Keyboard Operability', () => {
  it('focusable elements follow visual reading order', () => {
    // Collect all focusable elements in DOM order
    const focusable = document.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(0);

    // Verify no positive tabindex values (which would disrupt natural order)
    focusable.forEach(el => {
      const tabindex = el.getAttribute('tabindex');
      if (tabindex !== null) {
        expect(parseInt(tabindex, 10)).toBeLessThanOrEqual(0);
      }
    });
  });

  it('skip link is the first focusable element', () => {
    const focusable = document.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    expect(first.classList.contains('skip-link')).toBe(true);
  });

  it('all buttons have accessible names', () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      const hasAriaLabel = btn.getAttribute('aria-label');
      const hasText = btn.textContent.trim().length > 0;
      expect(hasAriaLabel || hasText).toBeTruthy();
    });
  });

  it('all links have accessible names', () => {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const hasAriaLabel = link.getAttribute('aria-label');
      const hasText = link.textContent.trim().length > 0;
      expect(hasAriaLabel || hasText).toBeTruthy();
    });
  });
});
