/**
 * Main JavaScript — Scroll-spy, Smooth Scroll, Mobile Nav Toggle
 * Progressive enhancement: all content is accessible without JS.
 */

(function () {
  'use strict';

  // --- Configuration ---
  const SECTION_IDS = [
    'hero', 'experience', 'projects', 'skills', 'certifications',
    'awards', 'education', 'organizations', 'contact'
  ];
  const ACTIVE_CLASS = 'is-active';
  const OPEN_CLASS = 'is-open';
  const STICKY_CLASS = 'is-sticky';

  // Check reduced-motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * Returns the appropriate scroll behavior based on motion preference.
   * @returns {'smooth' | 'instant'}
   */
  function getScrollBehavior() {
    return prefersReducedMotion.matches ? 'instant' : 'smooth';
  }

  // --- DOM References ---
  const navHeader = document.querySelector('.nav-edge');
  const navToggle = document.querySelector('.nav-toggle');
  const navOverlay = document.getElementById('nav-overlay');
  const navLinks = document.querySelectorAll('.nav-link');
  const overlayLinks = document.querySelectorAll('.nav-overlay__link');
  const allNavLinks = [...navLinks, ...overlayLinks];

  // Collect section elements
  const sections = SECTION_IDS
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  // --- Scroll-Spy via IntersectionObserver ---
  // Track which sections are currently visible
  const visibleSections = new Map();

  /**
   * Updates the active nav link based on the topmost visible section.
   */
  function updateActiveLink() {
    // Find the topmost visible section (smallest top offset)
    var topmostId = null;
    var topmostTop = Infinity;

    visibleSections.forEach(function (entry, id) {
      if (entry.isIntersecting) {
        var rect = entry.target.getBoundingClientRect();
        if (rect.top < topmostTop) {
          topmostTop = rect.top;
          topmostId = id;
        }
      }
    });

    // If no section is intersecting, keep the last active or default to first
    if (!topmostId) {
      // Find the section closest to the top (even if above viewport)
      var closestId = null;
      var closestDistance = Infinity;
      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var distance = Math.abs(rect.top);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = section.id;
        }
      });
      topmostId = closestId;
    }

    if (!topmostId) return;

    // Update active class on all nav links
    allNavLinks.forEach(function (link) {
      var linkSection = link.getAttribute('data-section');
      if (linkSection === topmostId) {
        link.classList.add(ACTIVE_CLASS);
      } else {
        link.classList.remove(ACTIVE_CLASS);
      }
    });
  }

  // Create IntersectionObserver for scroll-spy
  var observerOptions = {
    root: null,
    rootMargin: '-10% 0px -60% 0px',
    threshold: 0
  };

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      visibleSections.set(entry.target.id, entry);
    });
    updateActiveLink();
  }, observerOptions);

  // Observe all sections
  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // --- Sticky Navigation ---
  var heroSection = document.getElementById('hero');

  if (heroSection && navHeader) {
    var stickyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navHeader.classList.remove(STICKY_CLASS);
        } else {
          navHeader.classList.add(STICKY_CLASS);
        }
      });
    }, {
      root: null,
      threshold: 0,
      rootMargin: '0px'
    });

    stickyObserver.observe(heroSection);
  }

  // --- Smooth Scroll on Nav Link Click ---
  /**
   * Handles nav link click — smooth scrolls to target section.
   * @param {Event} event
   */
  function handleNavLinkClick(event) {
    var link = event.currentTarget;
    var sectionId = link.getAttribute('data-section');
    var targetSection = sectionId ? document.getElementById(sectionId) : null;

    if (targetSection) {
      event.preventDefault();
      targetSection.scrollIntoView({ behavior: getScrollBehavior() });

      // Close mobile nav if open
      if (navOverlay && navOverlay.classList.contains(OPEN_CLASS)) {
        closeMobileNav();
      }
    }
  }

  // Attach click handlers to all nav links
  allNavLinks.forEach(function (link) {
    link.addEventListener('click', handleNavLinkClick);
  });

  // --- Mobile Navigation Toggle ---
  /**
   * Opens the mobile navigation overlay.
   */
  function openMobileNav() {
    if (!navToggle || !navOverlay) return;
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation menu');
    navOverlay.classList.add(OPEN_CLASS);
    navOverlay.setAttribute('aria-hidden', 'false');
    // Prevent body scroll while overlay is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the mobile navigation overlay.
   */
  function closeMobileNav() {
    if (!navToggle || !navOverlay) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    navOverlay.classList.remove(OPEN_CLASS);
    navOverlay.setAttribute('aria-hidden', 'true');
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Toggles the mobile navigation overlay.
   */
  function toggleMobileNav() {
    var isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  // Attach toggle handler
  if (navToggle) {
    navToggle.addEventListener('click', toggleMobileNav);
  }

  // Close mobile nav on Escape key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && navOverlay && navOverlay.classList.contains(OPEN_CLASS)) {
      closeMobileNav();
      navToggle.focus();
    }
  });

  // --- Expand / Collapse (Certifications) ---
  var certExpandBtn = document.getElementById('cert-expand-btn');
  var certHidden = document.getElementById('cert-hidden');

  if (certExpandBtn && certHidden) {
    certExpandBtn.addEventListener('click', function () {
      certHidden.classList.add('is-visible');
      certExpandBtn.setAttribute('aria-expanded', 'true');
      certExpandBtn.style.display = 'none';
    });
  }

  // --- Theme Toggle (dark default / light) ---
  (function initThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    var root = document.documentElement;

    function currentTheme() {
      return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function syncLabel() {
      var isLight = currentTheme() === 'light';
      var label = isLight ? 'Switch to dark theme' : 'Switch to light theme';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
    }

    syncLabel();

    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      if (next === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
      syncLabel();

      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'light' ? '#f5f1ea' : '#1a1714');
    });
  })();

  // --- Initial State ---
  // Set initial active link on page load
  updateActiveLink();

  // --- Awards Progressive Reveal ---
  (function initAwardsReveal() {
    var showMoreBtn = document.querySelector('[data-awards-toggle]');
    if (!showMoreBtn) return;

    var awardsSection = document.getElementById('awards');
    if (!awardsSection) return;

    // Collect all award entries across both groups in DOM order
    var allEntries = Array.prototype.slice.call(
      awardsSection.querySelectorAll('.award-entry')
    );
    var total = allEntries.length;
    var initialCount = 10;
    var perClick = 5;
    var visibleCount = initialCount;

    // Apply initial hidden state (first 10 visible, rest hidden)
    allEntries.forEach(function (entry, index) {
      if (index < initialCount) {
        entry.removeAttribute('hidden');
      } else {
        entry.setAttribute('hidden', '');
      }
    });

    // Hide button if all entries already visible
    if (total <= initialCount) {
      showMoreBtn.setAttribute('hidden', '');
      return;
    }

    showMoreBtn.addEventListener('click', function () {
      visibleCount = Math.min(visibleCount + perClick, total);

      allEntries.forEach(function (entry, index) {
        if (index < visibleCount) {
          entry.removeAttribute('hidden');
        }
      });

      // Update button state
      if (visibleCount >= total) {
        showMoreBtn.setAttribute('hidden', '');
        showMoreBtn.setAttribute('aria-expanded', 'true');
      } else {
        showMoreBtn.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  // --- Project Image Galleries ---
  (function initProjectGalleries() {
    var galleries = document.querySelectorAll('[data-gallery]');
    if (!galleries.length) return;

    galleries.forEach(function (gallery) {
      var track = gallery.querySelector('[data-gallery-track]');
      var slides = track ? track.children : [];
      var count = slides.length;
      if (!track || count <= 1) return;

      var dots = gallery.querySelectorAll('[data-gallery-dot]');
      var prevBtn = gallery.querySelector('[data-gallery-prev]');
      var nextBtn = gallery.querySelector('[data-gallery-next]');
      var index = 0;

      function update() {
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        Array.prototype.forEach.call(dots, function (dot, i) {
          if (i === index) {
            dot.classList.add('is-active');
            dot.setAttribute('aria-current', 'true');
          } else {
            dot.classList.remove('is-active');
            dot.removeAttribute('aria-current');
          }
        });
      }

      function go(next) {
        index = (next + count) % count;
        update();
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); });
      Array.prototype.forEach.call(dots, function (dot, i) {
        dot.addEventListener('click', function () { go(i); });
      });

      // Touch swipe support.
      var startX = 0;
      var swiping = false;
      gallery.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        swiping = true;
      }, { passive: true });
      gallery.addEventListener('touchend', function (e) {
        if (!swiping) return;
        swiping = false;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) { go(dx < 0 ? index + 1 : index - 1); }
      }, { passive: true });

      update();
    });
  })();

  // --- Lightbox (zoom project images) ---
  (function initLightbox() {
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg) return;

    var lastFocused = null;

    function open(src, alt) {
      lastFocused = document.activeElement;
      lightboxImg.setAttribute('src', src);
      lightboxImg.setAttribute('alt', alt || '');
      lightbox.hidden = false;
      lightbox.setAttribute('aria-hidden', 'false');
      // Next frame so the transition runs.
      requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      var closeBtn = lightbox.querySelector('[data-lightbox-close]');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      var done = function () {
        lightbox.hidden = true;
        lightboxImg.setAttribute('src', '');
        lightbox.removeEventListener('transitionend', done);
      };
      if (prefersReducedMotion.matches) { done(); }
      else { lightbox.addEventListener('transitionend', done); }
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    // Open on click / keyboard activation of any zoomable image.
    document.addEventListener('click', function (e) {
      var img = e.target.closest('[data-zoomable]');
      if (img) { e.preventDefault(); open(img.getAttribute('src'), img.getAttribute('alt')); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement &&
          document.activeElement.matches('[data-zoomable]')) {
        e.preventDefault();
        open(document.activeElement.getAttribute('src'), document.activeElement.getAttribute('alt'));
      }
    });

    // Close on backdrop click, close button, or Escape.
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.closest('[data-lightbox-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) close();
    });
  })();

})();
