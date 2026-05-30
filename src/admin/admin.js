/* Custom admin app — schema-driven CRUD over the content files.
   Talks to the local save-server (scripts/admin-server.mjs). */

const API = '';

// ── Field schemas (mirror the data shapes) ───────────────────────────────
const SCHEMAS = {
  socials: {
    label: 'Contact & Socials', singular: 'Link',
    title: (d) => d.platform || 'New Link', meta: (d) => d.label || d.url,
    slug: (d) => `${String(d.order ?? 1).padStart(2, '0')}-${slugify(d.platform)}`,
    sortKey: (d) => String(d.order ?? 99).padStart(4, '0'),
    fields: [
      { name: 'order', label: 'Order', type: 'number', default: 1, hint: 'Lower numbers appear first.' },
      { name: 'platform', label: 'Platform', type: 'select', options: ['Email', 'LinkedIn', 'GitHub', 'Twitter', 'Instagram', 'YouTube', 'Medium', 'Other'] },
      { name: 'label', label: 'Display Label', type: 'text', hint: 'What the user sees (e.g. deltarfd@live.com or github.com/deltarfd)' },
      { name: 'url', label: 'URL / Link', type: 'text', hint: 'The actual link (e.g. mailto:deltarfd@live.com or https://github.com/deltarfd)' }
    ],
  },

  site: {
    label: 'Site & Profile',
    single: true,
    fields: [
      { name: 'wordmark', label: 'Nav wordmark', type: 'text' },
      { name: 'name', label: 'Full name', type: 'text' },
      { name: 'title', label: 'Headline / title', type: 'text' },
      { name: 'eyebrow', label: 'Profile eyebrow', type: 'text' },
      { name: 'summary', label: 'Profile summary', type: 'textarea' },
      { name: 'photo', label: 'Profile photo', type: 'image' },
      { name: 'photoAlt', label: 'Profile photo alt text', type: 'text' },
      { name: 'metaDescription', label: 'Meta description', type: 'textarea', hint: 'Used by search engines and social shares.' },
      { name: 'footer.line', label: 'Footer — Closing line', type: 'text' },
      { name: 'footer.sign', label: 'Footer — Signature', type: 'text' },
    ],
  },
  experience: {
    label: 'Experience', singular: 'Role',
    title: (d) => [d.title, d.company].filter(Boolean).join(' · '),
    meta: (d) => composeExpMeta(d),
    slug: (d) => `${String(d.order ?? 1).padStart(2, '0')}-${slugify((d.title || '') + '-' + (d.company || ''))}`,
    sortKey: (d) => d.startDate || '',
    skillField: 'technologies',
    fields: [
      { name: 'order', label: 'Order', type: 'number', default: 1, hint: 'Lower numbers appear first.' },
      { name: 'title', label: 'Job title', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'employmentType', label: 'Employment type', type: 'select', options: ['Full-time', 'Part-time', 'Freelance', 'Internship', 'Contract'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start', type: 'month' },
      { name: 'endDate', label: 'End', type: 'month', hint: 'Leave blank for Present.' },
      { name: 'responsibilities', label: 'Responsibilities', type: 'list', multiline: true },
      { name: 'technologies', label: 'Technologies / Skills', type: 'skills' },
    ],
  },
  projects: {
    label: 'Projects', singular: 'Project',
    title: (d) => d.name, meta: (d) => d.role,
    slug: (d) => `${String(d.order ?? 1).padStart(2, '0')}-${slugify(d.name)}`,
    sortKey: (d) => String(d.order ?? 0).padStart(4, '0'),
    skillField: 'tech',
    fields: [
      { name: 'order', label: 'Order', type: 'number', default: 1, hint: 'Lower numbers appear first.' },
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'media', label: 'Preview images', type: 'medialist', hint: 'Optional. Add one or more screenshots/covers — upload files or paste image URLs (e.g. GitHub raw links). They show as a swipeable gallery.' },
      { name: 'tech', label: 'Tech / Skills', type: 'skills' },
      { name: 'url', label: 'Repo / live URL', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'boolean', hint: 'Pins the project first with a Featured badge.' },
    ],
  },
  skills: {
    label: 'Skills', singular: 'Category',
    title: (d) => d.category, meta: (d) => (d.skills || []).join(', '),
    slug: (d) => `${String(d.order ?? 1).padStart(2, '0')}-${slugify(d.category)}`,
    sortKey: (d) => String(d.order ?? 0).padStart(4, '0'),
    fields: [
      { name: 'order', label: 'Order', type: 'number', default: 1, hint: 'Lower numbers appear first.' },
      { name: 'category', label: 'Category name', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'boolean', hint: 'Accent color and a larger heading on the site.' },
      { name: 'skills', label: 'Skills', type: 'list' },
    ],
  },
  certifications: {
    label: 'Certifications', singular: 'Certification',
    title: (d) => d.name,
    meta: (d) => {
      let status = '';
      if (d.expiration) {
        const [y, m] = d.expiration.split('-');
        if (y && m && new Date(y, m - 1, 1) < new Date()) status = ' (Expired)';
      }
      return `${d.organization || 'Unknown'} · ${d.expiration ? d.expiration + status : 'No expiration'}`;
    },
    slug: (d) => slugify(d.name + ' ' + d.organization),
    sortKey: (d) => d.expiration || '',
    skillField: 'skills',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'organization', label: 'Issuing organization', type: 'text' },
      { name: 'issued', label: 'Issued', type: 'month', hint: 'Month the certificate was issued.' },
      { name: 'expiration', label: 'Expiration', type: 'month', hint: "Leave blank if it doesn't expire." },
      { name: 'credentialUrl', label: 'Verification URL', type: 'text', hint: 'Link to verify the credential (Credly, issuer page, etc.).' },
      { name: 'media', label: 'Certificate image', type: 'media', hint: 'Optional. Upload a scan/screenshot, or paste an image URL.' },
      { name: 'isKey', label: 'Featured', type: 'boolean', hint: 'Shows in the highlighted certifications.' },
      { name: 'skills', label: 'Skills', type: 'skills' },
    ],
  },
  awards: {
    label: 'Awards', singular: 'Award',
    title: (d) => d.title, meta: (d) => `${d.year} · ${d.eventName}`,
    slug: (d) => `${d.year}-${slugify(d.title)}`,
    sortKey: (d) => String(d.year || ''),
    fields: [
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'eventName', label: 'Event / granting body', type: 'text' },
      { name: 'placement', label: 'Placement', type: 'select', options: ['1st Place', '2nd Place', '3rd Place', 'Finalist', 'Honoree'] },
      { name: 'category', label: 'Category', type: 'select', options: ['competition', 'academic'] },
    ],
  },
  organizations: {
    label: 'Organizations', singular: 'Organization',
    title: (d) => d.role, meta: (d) => d.organization,
    slug: (d) => slugify(d.role),
    sortKey: (d) => d.startDate || '',
    fields: [
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'organization', label: 'Organization', type: 'text' },
      { name: 'startDate', label: 'Start', type: 'month' },
      { name: 'endDate', label: 'End', type: 'month', hint: 'Leave blank for Present.' },
    ],
  },
  education: {
    label: 'Education', singular: 'School',
    title: (d) => [d.degree, d.major].filter(Boolean).join(' · '),
    meta: (d) => {
      const yr = (v) => (v ? String(v).split('-')[0] : '');
      const range = d.startDate ? `${yr(d.startDate)}–${d.endDate ? yr(d.endDate) : 'Present'}` : '';
      const gpa = d.gpa ? `GPA ${d.gpa}${d.gpaScale ? '/' + d.gpaScale : ''}` : '';
      return [d.institution, range, gpa].filter(Boolean).join(' · ');
    },
    slug: (d) => `${String(d.order ?? 1).padStart(2, '0')}-${slugify(d.institution)}`,
    sortKey: (d) => d.startDate || '',
    fields: [
      { name: 'order', label: 'Order', type: 'number', default: 1, hint: 'Lower numbers appear first.' },
      { name: 'degree', label: 'Degree', type: 'text' },
      { name: 'major', label: 'Major / Field', type: 'text' },
      { name: 'institution', label: 'Institution', type: 'text' },
      { name: 'startDate', label: 'Start', type: 'month' },
      { name: 'endDate', label: 'End', type: 'month', hint: 'Leave blank for Present.' },
      { name: 'gpa', label: 'GPA', type: 'text', hint: 'e.g. 3.58' },
      { name: 'gpaScale', label: 'GPA scale', type: 'text', hint: 'e.g. 4.00' },
      { name: 'note', label: 'Note', type: 'text', hint: 'Optional.' },
    ],
  },
};

const ORDER = ['site', 'experience', 'projects', 'skills', 'certifications', 'awards', 'education', 'organizations'];

// Parse "YYYY-MM" → comparable number (YYYYMM), or 0 when absent.
function ym(v) {
  if (!v) return 0;
  const [y, m] = String(v).split('-').map(Number);
  if (!y) return 0;
  return y * 100 + (m || 0);
}
const ord = (d) => (Number.isFinite(d.order) ? d.order : Infinity);

/**
 * Per-collection display comparators that mirror the public site ordering,
 * so the admin "Site order" matches the dashboard exactly.
 *
 * The site rule is uniform: if EVERY entry in a collection has a manual
 * `order` (set via drag-to-reorder), the list sorts purely by that order;
 * otherwise it falls back to the section's natural default. `allOrdered`
 * captures that, evaluated per-collection before sorting.
 */
const DISPLAY_SORT = {
  experience: (a, b) => (ym(b.startDate) - ym(a.startDate)),
  projects: (a, b) => (Number(Boolean(b.featured)) - Number(Boolean(a.featured))),
  skills: (a, b) => ord(a) - ord(b),
  certifications: (a, b) => {
    if (Boolean(a.isKey) !== Boolean(b.isKey)) return a.isKey ? -1 : 1;
    if (a.isKey && b.isKey) {
      const ak = Number.isFinite(a.keyOrder) ? a.keyOrder : 0;
      const bk = Number.isFinite(b.keyOrder) ? b.keyOrder : 0;
      if (ak !== bk) return ak - bk;
    }
    return ym(b.expiration) - ym(a.expiration);
  },
  awards: (a, b) => ((b.year || 0) - (a.year || 0)),
  education: (a, b) => (ym(b.startDate) - ym(a.startDate)),
  organizations: (a, b) => (ym(b.startDate) - ym(a.startDate)) || String(a.organization || '').localeCompare(String(b.organization || '')),
};

// Returns a sorted, de-duplicated list of all skill names used anywhere
// (skills collection + experience.technologies + projects.tech + cert skills).
function allSkillNames() {
  const set = new Set();
  for (const c of (store.skills || [])) for (const s of (c.data.skills || [])) set.add(s);
  for (const e of (store.experience || [])) for (const s of (e.data.technologies || [])) set.add(s);
  for (const p of (store.projects || [])) for (const s of (p.data.tech || [])) set.add(s);
  for (const c of (store.certifications || [])) for (const s of (c.data.skills || [])) set.add(s);
  return [...set].sort((a, b) => a.localeCompare(b));
}

let store = null;
let current = 'site';

// ── Helpers ───────────────────────────────────────────────────────────────
function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtMonth(ym) {
  if (!ym) return '';
  const [y, m] = String(ym).split('-').map(Number);
  if (!y || !m) return '';
  return `${MONTHS[m - 1]} ${y}`;
}
/** Whole-month difference between two YYYY-MM strings (end defaults to now). */
function monthsBetween(startYM, endYM) {
  if (!startYM) return 0;
  const [sy, sm] = String(startYM).split('-').map(Number);
  let ey, em;
  if (endYM) { [ey, em] = String(endYM).split('-').map(Number); }
  else { const n = new Date(); ey = n.getFullYear(); em = n.getMonth() + 1; }
  if (!sy || !sm || !ey || !em) return 0;
  return Math.max(0, (ey - sy) * 12 + (em - sm));
}
/** "X yrs Y mos" / "X mos" from a month count. */
function fmtDuration(months) {
  if (months <= 0) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  const yr = y ? `${y} yr${y > 1 ? 's' : ''}` : '';
  const mo = m ? `${m} mo${m > 1 ? 's' : ''}` : '';
  return [yr, mo].filter(Boolean).join(' ');
}
function composeExpMeta(d) {
  const start = fmtMonth(d.startDate);
  const end = d.endDate ? fmtMonth(d.endDate) : 'Present';
  const range = start ? `${start} – ${end}` : '';
  const dur = fmtDuration(monthsBetween(d.startDate, d.endDate));
  return [d.employmentType, d.location, range, dur].filter(Boolean).join(' · ');
}
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) { o[keys[i]] = o[keys[i]] || {}; o = o[keys[i]]; }
  o[keys[keys.length - 1]] = value;
}
function status(msg, kind) {
  const el = document.getElementById('adm-status');
  el.textContent = msg || '';
  el.className = 'adm-status' + (kind ? ' is-' + kind : '');
  if (msg && kind === 'ok') setTimeout(() => { if (el.textContent === msg) { el.textContent = ''; el.className = 'adm-status'; } }, 2500);
}
async function api(path, method, body) {
  const headers = { 'Content-Type': 'application/json' };
  const auth = localStorage.getItem('adm_auth');
  if (auth) headers['Authorization'] = 'Basic ' + auth;
  const res = await fetch(API + path, {
    method: method || 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error('401');
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}
function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
  return n;
}

// ── Sidebar ─────────────────────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('adm-nav');
  nav.innerHTML = '';
  for (const key of ORDER) {
    const schema = SCHEMAS[key];
    const count = schema.single ? null : (store[key] || []).length;
    const btn = el('button', { class: key === current ? 'is-active' : '', onclick: () => { current = key; render(); } },
      el('span', {}, schema.label),
      count != null ? el('span', { class: 'adm-count' }, String(count)) : null,
    );
    nav.append(el('li', {}, btn));
  }
}

// ── Views ─────────────────────────────────────────────────────────────────
function render(preserveScroll = false) {
  const scrollPos = window.scrollY;
  renderNav();
  const main = document.getElementById('adm-main');
  main.innerHTML = '';
  const schema = SCHEMAS[current];
  if (schema.single) main.append(renderForm(schema, current, store.site, null));
  else main.append(renderList(schema, current));
  
  if (!preserveScroll) {
    main.scrollIntoView({ behavior: 'instant', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else {
    window.scrollTo({ top: scrollPos, behavior: 'instant' });
  }
}

// Per-collection UI state (sort direction + search query).
const listState = {};
function stateFor(key) {
  if (!listState[key]) listState[key] = { sort: 'site', q: '' };
  return listState[key];
}

function sortedFiltered(schema, key) {
  const st = stateFor(key);
  let rows = [...(store[key] || [])];

  // Filter by search query against title + meta + skills.
  const q = st.q.trim().toLowerCase();
  if (q) {
    rows = rows.filter((e) => {
      const skillField = schema.skillField;
      const skills = skillField && Array.isArray(e.data[skillField]) ? e.data[skillField].join(' ') : '';
      const hay = `${schema.title(e.data)} ${schema.meta(e.data) || ''} ${skills}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // Sort.
  const keyFn = schema.sortKey || (() => '');
  if (st.sort === 'site') {
    const cmp = DISPLAY_SORT[key];
    // Mirror the site: if every entry has a manual order, sort purely by it;
    // otherwise use the section's natural comparator.
    const allOrdered = rows.length > 0 && rows.every((e) => Number.isFinite(e.data.order));
    if (allOrdered) rows.sort((a, b) => a.data.order - b.data.order);
    else if (cmp) rows.sort((a, b) => cmp(a.data, b.data));
  } else if (st.sort === 'newest') {
    rows.sort((a, b) => String(keyFn(b.data)).localeCompare(String(keyFn(a.data))));
  } else if (st.sort === 'oldest') {
    rows.sort((a, b) => String(keyFn(a.data)).localeCompare(String(keyFn(b.data))));
  } else if (st.sort === 'az') {
    rows.sort((a, b) => String(schema.title(a.data)).localeCompare(String(schema.title(b.data))));
  } else if (st.sort === 'za') {
    rows.sort((a, b) => String(schema.title(b.data)).localeCompare(String(schema.title(a.data))));
  }
  
  // Always push hidden/expired items to the very bottom, keeping previous sort order
  rows.sort((a, b) => {
    const isHide = (d) => {
      if (d.hidden) return true;
      if (d.expiration) {
        const [y, m] = d.expiration.split('-');
        if (y && m && new Date(y, m - 1, 1) < new Date()) return true;
      }
      return false;
    };
    const hA = isHide(a.data);
    const hB = isHide(b.data);
    if (hA && !hB) return 1;
    if (!hA && hB) return -1;
    return 0;
  });

  return rows;
}

// Persist a new manual order for a collection to the server, then reload.
async function persistOrder(key, slugs) {
  try {
    status('Saving order…');
    await api('/api/reorder', 'POST', { collection: key, slugs });
    status('Order saved · site rebuilt', 'ok');
    await load();
    render();
  } catch (e) {
    status('Reorder failed: ' + e.message, 'err');
  }
}

function renderList(schema, key) {
  const st = stateFor(key);
  const wrap = el('div');
  const total = (store[key] || []).length;
  const canReorder = !!DISPLAY_SORT[key];

  const head = el('div', { class: 'adm-head' },
    el('div', { class: 'adm-head__meta' },
      el('h1', {}, schema.label),
      el('p', { class: 'adm-head__sub' }, `${total} ${schema.singular.toLowerCase()}(s)`)),
    el('button', { class: 'btn btn--primary', onclick: () => openEditor(schema, key, null) }, `+ New ${schema.singular}`),
  );
  wrap.append(head);

  // Toolbar: search + sort
  const dateLike = ['experience', 'awards', 'certifications', 'organizations'].includes(key);
  const sortOptions = [
    { v: 'site', label: 'Site order (as shown)' },
    ...(dateLike ? [{ v: 'newest', label: 'Newest first' }, { v: 'oldest', label: 'Oldest first' }] : []),
    { v: 'az', label: 'A → Z' },
    { v: 'za', label: 'Z → A' },
  ];

  const search = el('input', {
    type: 'text', class: 'adm-toolbar__search',
    placeholder: schema.skillField ? `Filter by name or skill…` : `Filter ${schema.label.toLowerCase()}…`,
    oninput: (e) => { st.q = e.target.value; refreshList(); },
  });
  search.value = st.q;

  const sortSel = el('select', { class: 'adm-toolbar__sort', onchange: (e) => { st.sort = e.target.value; refreshList(); } },
    ...sortOptions.map((o) => {
      const opt = el('option', { value: o.v }, o.label);
      if (o.v === st.sort) opt.selected = true;
      return opt;
    }),
  );

  const toolbar = el('div', { class: 'adm-toolbar' },
    el('div', { class: 'adm-toolbar__field' },
      el('span', { class: 'adm-toolbar__icon', html: '&#x1F50D;' }), search),
    el('label', { class: 'adm-toolbar__sortwrap' }, el('span', {}, 'Sort'), sortSel),
  );
  wrap.append(toolbar);

  const hintEl = canReorder ? el('p', { class: 'adm-reorder-hint' }) : null;
  if (hintEl) wrap.append(hintEl);

  const listEl = el('div', { class: 'adm-list', id: 'adm-list' });
  wrap.append(listEl);

  function refreshList() {
    listEl.innerHTML = '';

    // Recompute on every refresh so sort/filter changes take effect immediately.
    const reorderActive = canReorder && st.sort === 'site' && !st.q.trim();
    if (hintEl) {
      hintEl.textContent = reorderActive
        ? 'Drag the ⠿ handle to reorder. The order is saved and reflected on your site.'
        : 'Switch to "Site order" and clear the filter to drag-and-drop reorder.';
    }

    const rows = sortedFiltered(schema, key);
    if (!rows.length) {
      listEl.append(el('div', { class: 'adm-empty' },
        total === 0 ? 'No entries yet. Click “New” to add one.' : 'No matches for your filter.'));
      return;
    }

    // Running counter of featured items (for the "Featured #n" badge).
    let featuredSeen = 0;

    rows.forEach((entry, i) => {
      const d = entry.data;
      const isFeatured = Boolean(d.featured || d.isKey);
      if (isFeatured) featuredSeen++;

      const handle = reorderActive
        ? el('button', { class: 'adm-card__handle', type: 'button', 'aria-label': 'Drag to reorder', title: 'Drag to reorder', tabindex: '-1' }, '⠿')
        : null;

      const tags = el('div', { class: 'adm-card__tags' });
      tags.append(el('span', { class: 'adm-card__pos', title: 'Position on the site' }, '#' + (i + 1)));
      if (isFeatured) tags.append(el('span', { class: 'adm-card__tag' }, 'Featured #' + featuredSeen));

      let isExpired = false;
      if (d.expiration) {
        const [y, m] = d.expiration.split('-');
        if (y && m && new Date(y, m - 1, 1) < new Date()) isExpired = true;
      }
      const isHidden = Boolean(d.hidden) || isExpired;
      const card = el('div', { class: 'adm-card' + (reorderActive ? ' is-draggable' : '') + (isHidden ? ' is-hidden' : '') },
        handle,
        el('div', { class: 'adm-card__body', style: 'cursor: pointer;', onclick: () => openEditor(schema, key, entry) },
          tags,
          el('p', { class: 'adm-card__title' }, schema.title(d) || '(untitled)'),
          schema.meta(d) ? el('p', { class: 'adm-card__meta' }, schema.meta(d)) : null,
        ),
        el('div', { class: 'adm-card__actions' },
          el('button', {
            class: 'btn btn--icon',
            title: isExpired ? 'Cannot show (expired)' : (isHidden ? 'Show on site' : 'Hide from site'),
            disabled: isExpired ? true : undefined,
            onclick: () => toggleHidden(key, entry),
            html: isHidden
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
          }),
          el('button', { class: 'btn', onclick: () => openEditor(schema, key, entry) }, 'Edit'),
          el('button', { class: 'btn btn--danger', onclick: () => removeEntry(key, entry) }, 'Delete'),
        ),
      );

      if (reorderActive) {
        card.dataset.slug = entry.slug;
        // Only start a drag from the handle (so text/buttons stay usable).
        handle.addEventListener('mousedown', () => { card.setAttribute('draggable', 'true'); });
        handle.addEventListener('touchstart', () => { card.setAttribute('draggable', 'true'); }, { passive: true });
        card.addEventListener('dragstart', (e) => {
          card.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', entry.slug); } catch (err) {}
        });
        card.addEventListener('dragend', () => {
          card.classList.remove('is-dragging');
          card.removeAttribute('draggable');
        });
        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          const dragging = listEl.querySelector('.is-dragging');
          if (!dragging || dragging === card) return;
          const rect = card.getBoundingClientRect();
          const after = (e.clientY - rect.top) > rect.height / 2;
          listEl.insertBefore(dragging, after ? card.nextSibling : card);
        });
        card.addEventListener('drop', (e) => {
          e.preventDefault();
          const slugs = [...listEl.querySelectorAll('.adm-card')].map((c) => c.dataset.slug);
          persistOrder(key, slugs);
        });
      }

      listEl.append(card);
    });
  }
  refreshList();
  return wrap;
}

function openEditor(schema, key, entry) {
  const main = document.getElementById('adm-main');
  main.innerHTML = '';
  const data = entry ? structuredClone(entry.data) : defaults(schema);
  main.append(renderForm(schema, key, data, entry));
  main.scrollIntoView({ behavior: 'instant', block: 'start' });
}

function defaults(schema) {
  const d = {};
  for (const f of schema.fields) {
    if (f.type === 'list') setPath(d, f.name, []);
    else if (f.type === 'skills') setPath(d, f.name, []);
    else if (f.type === 'image') setPath(d, f.name, '');
    else if (f.type === 'media') setPath(d, f.name, '');
    else if (f.type === 'medialist') setPath(d, f.name, []);
    else if (f.type === 'boolean') setPath(d, f.name, f.default ?? false);
    else if (f.type === 'number') setPath(d, f.name, f.default ?? 0);
    else if (f.type === 'select') setPath(d, f.name, f.options[0]);
    else setPath(d, f.name, '');
  }
  return d;
}

function renderForm(schema, key, data, entry) {
  const form = el('form', { class: 'adm-form', onsubmit: (e) => { e.preventDefault(); save(schema, key, data, entry); } });
  const isNew = !schema.single && !entry;

  const headChildren = [];
  if (!schema.single) {
    headChildren.push(el('button', {
      type: 'button', class: 'btn btn--ghost adm-form__back',
      onclick: () => render(),
    }, '← Back to ' + schema.label));
  }
  headChildren.push(el('h1', {}, schema.single ? schema.label : (isNew ? `New ${schema.singular}` : `Edit ${schema.singular}`)));
  form.append(el('div', { class: 'adm-head adm-head--form' }, ...headChildren));

  for (const f of schema.fields) {
    const value = getPath(data, f.name);
    form.append(renderField(f, value, (v) => setPath(data, f.name, v)));
  }

  const actions = el('div', { class: 'adm-form__actions' });
  if (!schema.single) actions.append(el('button', { type: 'button', class: 'btn btn--ghost', onclick: () => render() }, '← Back'));
  actions.append(el('button', { type: 'submit', class: 'btn btn--primary' }, schema.single ? 'Save profile' : 'Save'));
  form.append(actions);
  return form;
}

function renderField(f, value, onChange) {
  if (f.type === 'boolean') {
    const input = el('input', { type: 'checkbox', id: 'f-' + f.name, role: 'switch', onchange: (e) => onChange(e.target.checked) });
    if (value) input.checked = true;
    const label = el('label', { for: 'f-' + f.name },
      el('span', { class: 'adm-checkbox__name' }, f.label),
      f.hint ? infoIcon(f.hint) : null,
    );
    return el('div', { class: 'adm-field adm-checkbox' }, input, label);
  }
  const field = el('div', { class: 'adm-field' });
  field.append(el('label', { for: 'f-' + f.name }, f.label));

  if (f.type === 'textarea') {
    const ta = el('textarea', { id: 'f-' + f.name, oninput: (e) => onChange(e.target.value) });
    ta.value = value ?? '';
    field.append(ta);
  } else if (f.type === 'select') {
    const sel = el('select', { id: 'f-' + f.name, onchange: (e) => onChange(e.target.value) });
    for (const opt of f.options) {
      const o = el('option', { value: opt }, opt);
      if (opt === value) o.selected = true;
      sel.append(o);
    }
    field.append(sel);
  } else if (f.type === 'number') {
    const input = el('input', { type: 'number', id: 'f-' + f.name, oninput: (e) => onChange(e.target.value === '' ? '' : Number(e.target.value)) });
    if (value !== undefined && value !== null) input.value = value;
    field.append(input);
  } else if (f.type === 'month') {
    field.append(renderMonthField(f, value, onChange));
  } else if (f.type === 'image') {
    field.append(renderImageField(f, value, onChange));
  } else if (f.type === 'media') {
    field.append(renderMediaField(f, value, onChange));
  } else if (f.type === 'medialist') {
    field.append(renderMediaListField(f, value, onChange));
  } else if (f.type === 'list') {
    field.append(renderListField(f, Array.isArray(value) ? value : [], onChange));
  } else if (f.type === 'skills') {
    field.append(renderSkillsField(f, Array.isArray(value) ? value : [], onChange));
  } else {
    const input = el('input', { type: 'text', id: 'f-' + f.name, oninput: (e) => onChange(e.target.value) });
    input.value = value ?? '';
    field.append(input);
  }
  if (f.hint && !['skills', 'boolean', 'media', 'medialist'].includes(f.type)) field.append(el('p', { class: 'adm-field__hint' }, f.hint));
  return field;
}

/* Small info icon that reveals a tooltip on hover/focus. Used to keep field
   labels short while still surfacing the explanation on demand. */
function infoIcon(text) {
  const btn = el('button', {
    type: 'button', class: 'adm-info', tabindex: '0',
    'aria-label': text, title: text,
  }, 'i');
  btn.append(el('span', { class: 'adm-info__bubble', role: 'tooltip' }, text));
  return btn;
}

/* Month picker: Month + Year dropdowns that compose to "YYYY-MM".
   Replaces the native month input (which allowed broken half-typed states
   like "December 0001"). Blank month/year → empty value (= Present). */
function renderMonthField(f, value, onChange) {
  const [vy, vm] = String(value || '').split('-');
  let curY = vy || '';
  let curM = vm || '';

  function commit() {
    // Only emit a value when both parts are set; otherwise treat as blank.
    onChange(curY && curM ? `${curY}-${curM}` : '');
  }

  const now = new Date().getFullYear();
  const years = [];
  for (let y = now + 1; y >= 1975; y--) years.push(String(y));

  const monthSel = el('select', { 'aria-label': f.label + ' month', onchange: (e) => { curM = e.target.value; commit(); } },
    el('option', { value: '' }, 'Month'),
    ...MONTHS.map((name, i) => {
      const mm = String(i + 1).padStart(2, '0');
      const o = el('option', { value: mm }, name);
      if (mm === curM) o.selected = true;
      return o;
    }),
  );
  const yearSel = el('select', { 'aria-label': f.label + ' year', onchange: (e) => { curY = e.target.value; commit(); } },
    el('option', { value: '' }, 'Year'),
    ...years.map((y) => {
      const o = el('option', { value: y }, y);
      if (y === curY) o.selected = true;
      return o;
    }),
  );

  return el('div', { class: 'adm-monthfield' }, monthSel, yearSel);
}

function renderListField(f, arr, onChange) {
  const items = [...arr];
  const box = el('div', { class: 'adm-listfield' });

  function redraw() {
    box.innerHTML = '';
    items.forEach((val, i) => {
      const input = f.multiline
        ? el('textarea', { oninput: (e) => { items[i] = e.target.value; onChange([...items]); } })
        : el('input', { type: 'text', oninput: (e) => { items[i] = e.target.value; onChange([...items]); } });
      input.value = val ?? '';
      const row = el('div', { class: 'adm-listrow' },
        input,
        el('button', { type: 'button', class: 'btn btn--danger', title: 'Remove', onclick: () => { items.splice(i, 1); onChange([...items]); redraw(); } }, '×'),
      );
      box.append(row);
    });
    box.append(el('button', { type: 'button', class: 'btn', onclick: () => { items.push(''); onChange([...items]); redraw(); } }, '+ Add'));
  }
  redraw();
  return box;
}

/* Skills widget: chips you can remove + a filtering typeahead. Instead of a
   giant native <datalist> with every skill, we show a short popup (max 8) of
   matches that narrows as you type. Click a suggestion or press Enter to add;
   typing a brand-new name and pressing Enter adds it too. */
function renderSkillsField(f, arr, onChange) {
  const items = [...arr];
  const box = el('div', { class: 'adm-skillsfield' });
  let activeIndex = -1; // keyboard-highlighted suggestion

  function add(name) {
    const v = String(name || '').trim();
    if (v && !items.some((s) => s.toLowerCase() === v.toLowerCase())) {
      items.push(v);
      onChange([...items]);
      return true;
    }
    return false;
  }

  function suggestionsFor(q) {
    const query = q.trim().toLowerCase();
    const chosen = new Set(items.map((s) => s.toLowerCase()));
    let pool = allSkillNames().filter((n) => !chosen.has(n.toLowerCase()));
    if (query) pool = pool.filter((n) => n.toLowerCase().includes(query));
    return pool;
  }

  function redraw(focusInput) {
    box.innerHTML = '';

    // Selected chips.
    if (items.length) {
      const chips = el('div', { class: 'adm-chips' });
      items.forEach((val, i) => {
        chips.append(el('span', { class: 'adm-chip' }, val,
          el('button', { type: 'button', class: 'adm-chip__x', 'aria-label': 'Remove ' + val, onclick: () => { items.splice(i, 1); onChange([...items]); redraw(false); } }, '×'),
        ));
      });
      box.append(chips);
    }

    // Typeahead input + popup.
    const popup = el('div', { class: 'adm-typeahead__popup', hidden: true });

    function closePopup() { popup.hidden = true; popup.innerHTML = ''; activeIndex = -1; }

    function openPopup(q) {
      const matches = suggestionsFor(q);
      popup.innerHTML = '';
      activeIndex = -1;
      const query = q.trim();
      // Offer "Add new" when the typed value isn't an exact existing/selected match.
      const exists = query && (allSkillNames().some((n) => n.toLowerCase() === query.toLowerCase())
        || items.some((s) => s.toLowerCase() === query.toLowerCase()));
      if (!matches.length && !query) { closePopup(); return; }
      for (const name of matches) {
        popup.append(el('button', {
          type: 'button', class: 'adm-typeahead__opt',
          onmousedown: (e) => { e.preventDefault(); if (add(name)) redraw(true); },
        }, name));
      }
      if (query && !exists) {
        popup.append(el('button', {
          type: 'button', class: 'adm-typeahead__opt adm-typeahead__opt--new',
          onmousedown: (e) => { e.preventDefault(); if (add(query)) redraw(true); },
        }, el('span', { class: 'adm-typeahead__newtag' }, 'New'), 'Add “' + query + '”'));
      }
      popup.hidden = popup.children.length === 0;
    }

    function highlight(delta) {
      const opts = [...popup.querySelectorAll('.adm-typeahead__opt')];
      if (!opts.length) return;
      activeIndex = (activeIndex + delta + opts.length) % opts.length;
      opts.forEach((o, i) => o.classList.toggle('is-active', i === activeIndex));
      opts[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    const input = el('input', {
      type: 'text', class: 'adm-typeahead__input', placeholder: 'Search or add a skill…',
      autocomplete: 'off', role: 'combobox', 'aria-expanded': 'false', 'aria-autocomplete': 'list',
      oninput: (e) => openPopup(e.target.value),
      onfocus: (e) => openPopup(e.target.value),
      onblur: () => setTimeout(closePopup, 120),
      onkeydown: (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); highlight(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(-1); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          const opts = [...popup.querySelectorAll('.adm-typeahead__opt')];
          if (activeIndex >= 0 && opts[activeIndex]) { opts[activeIndex].dispatchEvent(new MouseEvent('mousedown')); }
          else if (add(e.target.value)) { redraw(true); }
          else { e.target.value = ''; closePopup(); }
        } else if (e.key === 'Escape') { closePopup(); }
      },
    });

    const wrap = el('div', { class: 'adm-typeahead' }, input, popup);
    box.append(wrap);
    box.append(el('p', { class: 'adm-field__hint' }, 'Search existing skills or type a new one. New skills are added to your Skills list automatically.'));
    if (focusInput) setTimeout(() => input.focus(), 0);
  }
  redraw(false);
  return box;
}

/* Image field: preview + upload button. Uploads to assets/ via /api/upload
   and stores the returned path (e.g. "assets/profile.jpg"). */
function renderImageField(f, value, onChange) {
  const box = el('div', { class: 'adm-imagefield' });
  let currentPath = value || '';

  function redraw() {
    box.innerHTML = '';
    const preview = el('div', { class: 'adm-image-preview' });
    if (currentPath) {
      // cache-bust so a re-upload shows immediately
      const img = el('img', { src: '/' + currentPath + '?t=' + Date.now(), alt: 'Profile preview' });
      img.onerror = () => { img.style.display = 'none'; };
      preview.append(img);
    } else {
      preview.append(el('span', { class: 'adm-image-empty' }, 'No photo yet'));
    }

    const fileInput = el('input', {
      type: 'file', accept: 'image/*', style: 'display:none', id: 'imgfile-' + f.name,
      onchange: (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            status('Uploading photo…');
            const resp = await api('/api/upload', 'POST', { filename: file.name, dataUrl: reader.result });
            currentPath = resp.path;
            onChange(currentPath);
            status('Photo uploaded · site rebuilt', 'ok');
            redraw();
          } catch (err) { status('Upload failed: ' + err.message, 'err'); }
        };
        reader.readAsDataURL(file);
      },
    });
    const pickBtn = el('button', { type: 'button', class: 'btn', onclick: () => fileInput.click() },
      currentPath ? 'Replace photo' : 'Upload photo');

    const row = el('div', { class: 'adm-listrow' }, pickBtn, fileInput);

    // Remove → reset to default placeholder.
    if (currentPath) {
      const removeBtn = el('button', { type: 'button', class: 'btn btn--danger', onclick: async () => {
        if (!confirm('Remove the photo and reset to the default placeholder?')) return;
        try {
          status('Removing photo…');
          await api('/api/upload', 'DELETE');
          currentPath = '';
          onChange('');
          status('Photo removed · save the profile to apply', 'ok');
          redraw();
        } catch (err) { status('Remove failed: ' + err.message, 'err'); }
      } }, 'Remove photo');
      row.append(removeBtn);
    }

    box.append(preview, row);
    if (currentPath) box.append(el('p', { class: 'adm-field__hint' }, currentPath));
  }
  redraw();
  return box;
}

/* Generic media field: rectangular preview + two ways to set an image —
   upload a file (saved under assets/media/ via /api/media) OR paste an
   external image URL (e.g. a GitHub raw link). Both store a string; absolute
   URLs are used as-is, local paths are rooted at build time by mediaSrc. */
function renderMediaField(f, value, onChange) {
  const box = el('div', { class: 'adm-mediafield' });
  let currentPath = value || '';

  const isAbsolute = (p) => /^(https?:)?\/\//i.test(p || '');
  const previewSrc = (p) => {
    if (!p) return '';
    if (isAbsolute(p)) return p;                       // external URL, as-is
    return '/' + p.replace(/^\/+/, '') + '?t=' + Date.now(); // local, cache-bust
  };

  function redraw() {
    box.innerHTML = '';

    const preview = el('div', { class: 'adm-media-preview' });
    if (currentPath) {
      preview.append(el('img', {
        src: previewSrc(currentPath), alt: 'Preview',
        onerror: function () {
          this.style.display = 'none';
          if (!preview.querySelector('.adm-image-empty')) {
            preview.append(el('span', { class: 'adm-image-empty' }, 'Image not reachable'));
          }
        },
      }));
    } else {
      preview.append(el('span', { class: 'adm-image-empty' }, 'No image yet'));
    }

    // Upload row.
    const fileInput = el('input', {
      type: 'file', accept: 'image/*', style: 'display:none', id: 'mediafile-' + f.name,
      onchange: (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            status('Uploading image…');
            const resp = await api('/api/media', 'POST', { filename: file.name, dataUrl: reader.result });
            currentPath = resp.path;
            onChange(currentPath);
            status('Image uploaded', 'ok');
            redraw();
          } catch (err) { status('Upload failed: ' + err.message, 'err'); }
        };
        reader.readAsDataURL(file);
      },
    });
    const pickBtn = el('button', { type: 'button', class: 'btn', onclick: () => fileInput.click() },
      currentPath ? 'Replace with upload' : 'Upload image');
    const uploadRow = el('div', { class: 'adm-listrow' }, pickBtn, fileInput);
    if (currentPath) {
      uploadRow.append(el('button', { type: 'button', class: 'btn btn--danger', onclick: () => {
        if (!confirm('Remove this image?')) return;
        currentPath = '';
        onChange('');
        status('Image removed · save to apply', 'ok');
        redraw();
      } }, 'Remove'));
    }

    // URL row — paste an external image link.
    const urlInput = el('input', {
      type: 'text', class: 'adm-media-url', placeholder: 'or paste an image URL (https://…)',
      value: isAbsolute(currentPath) ? currentPath : '',
    });
    const useUrlBtn = el('button', { type: 'button', class: 'btn', onclick: () => {
      const v = urlInput.value.trim();
      if (!v) return;
      currentPath = v;
      onChange(currentPath);
      status('Image URL set', 'ok');
      redraw();
    } }, 'Use URL');
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); useUrlBtn.click(); } });
    const urlRow = el('div', { class: 'adm-listrow' }, urlInput, useUrlBtn);

    box.append(preview, uploadRow, urlRow);
    if (f.hint) box.append(el('p', { class: 'adm-field__hint' }, f.hint));
  }
  redraw();
  return box;
}

/* Multi-image field: an ordered list of images for one entry (e.g. a project
   gallery). Each item can be set by upload or URL, reordered, or removed.
   Accepts a legacy string value (single image) and upgrades it to an array. */
function renderMediaListField(f, value, onChange) {
  const items = Array.isArray(value) ? [...value] : (value ? [value] : []);
  const box = el('div', { class: 'adm-medialist' });

  const isAbsolute = (p) => /^(https?:)?\/\//i.test(p || '');
  const previewSrc = (p) => {
    if (!p) return '';
    if (isAbsolute(p)) return p;
    return '/' + p.replace(/^\/+/, '') + '?t=' + Date.now();
  };
  const commit = () => onChange(items.filter(Boolean));

  function redraw() {
    box.innerHTML = '';

    items.forEach((val, i) => {
      const card = el('div', { class: 'adm-mediacard' });

      const preview = el('div', { class: 'adm-media-preview adm-media-preview--sm' });
      if (val) {
        preview.append(el('img', {
          src: previewSrc(val), alt: 'Preview ' + (i + 1),
          onerror: function () { this.style.display = 'none'; if (!preview.querySelector('.adm-image-empty')) preview.append(el('span', { class: 'adm-image-empty' }, 'Not reachable')); },
        }));
      } else {
        preview.append(el('span', { class: 'adm-image-empty' }, 'Empty'));
      }

      // Upload to replace this slot.
      const fileInput = el('input', {
        type: 'file', accept: 'image/*', style: 'display:none',
        onchange: (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              status('Uploading image…');
              const resp = await api('/api/media', 'POST', { filename: file.name, dataUrl: reader.result });
              items[i] = resp.path; commit();
              status('Image uploaded', 'ok'); redraw();
            } catch (err) { status('Upload failed: ' + err.message, 'err'); }
          };
          reader.readAsDataURL(file);
        },
      });

      // URL input for this slot.
      const urlInput = el('input', {
        type: 'text', class: 'adm-media-url', placeholder: 'Upload or paste an image URL…',
        value: val || '',
        oninput: (e) => { items[i] = e.target.value.trim(); },
        onblur: () => commit(),
        onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); redraw(); } },
      });

      const controls = el('div', { class: 'adm-mediacard__controls' },
        el('div', { class: 'adm-listrow' }, urlInput,
          el('button', { type: 'button', class: 'btn', onclick: () => fileInput.click() }, 'Upload'), fileInput),
        el('div', { class: 'adm-mediacard__btns' },
          el('button', { type: 'button', class: 'btn', title: 'Move up', disabled: i === 0 ? '' : null, onclick: () => { if (i > 0) { [items[i - 1], items[i]] = [items[i], items[i - 1]]; commit(); redraw(); } } }, '↑'),
          el('button', { type: 'button', class: 'btn', title: 'Move down', disabled: i === items.length - 1 ? '' : null, onclick: () => { if (i < items.length - 1) { [items[i + 1], items[i]] = [items[i], items[i + 1]]; commit(); redraw(); } } }, '↓'),
          el('button', { type: 'button', class: 'btn btn--danger', onclick: () => { items.splice(i, 1); commit(); redraw(); } }, 'Remove'),
        ),
      );

      card.append(preview, controls);
      box.append(card);
    });

    box.append(el('button', { type: 'button', class: 'btn', onclick: () => { items.push(''); redraw(); } }, '+ Add image'));
    if (f.hint) box.append(el('p', { class: 'adm-field__hint' }, f.hint));
  }
  redraw();
  return box;
}

// ── Persistence ────────────────────────────────────────────────────────────
async function save(schema, key, data, entry) {
  try {
    status('Saving…');
    // Coerce numbers left as strings
    for (const f of schema.fields) {
      if (f.type === 'number') {
        const v = getPath(data, f.name);
        if (v === '' || v === undefined) { if (f.name === 'keyOrder') setPath(data, f.name, undefined); }
        else setPath(data, f.name, Number(v));
      }
    }
    if (schema.single) {
      await api('/api/site', 'PUT', { data });
      store.site = data;
      status('Saved · site rebuilt', 'ok');
    } else {
      const slug = schema.slug(data);
      const oldSlug = entry ? entry.slug : null;
      const resp = await api('/api/entry', 'POST', { collection: key, slug, data });
      if (oldSlug && oldSlug !== slug) await api('/api/entry', 'DELETE', { collection: key, slug: oldSlug });
      const added = resp && resp.addedSkills ? ` · ${resp.addedSkills} new skill(s) added` : '';
      status('Saved · site rebuilt' + added, 'ok');
    }
    await load();
    render();
  } catch (e) {
    status('Save failed: ' + e.message, 'err');
  }
}

async function toggleHidden(key, entry) {
  const data = { ...entry.data, hidden: !entry.data.hidden };
  try {
    status(data.hidden ? 'Hiding…' : 'Showing…');
    await api('/api/entry', 'POST', { collection: key, slug: entry.slug, data });
    status(data.hidden ? 'Hidden · site rebuilt' : 'Visible · site rebuilt', 'ok');
    await load();
    render(true);
  } catch (e) {
    status('Toggle failed: ' + e.message, 'err');
  }
}

async function removeEntry(key, entry) {
  if (!confirm(`Delete "${entry.slug}"? This cannot be undone.`)) return;
  try {
    status('Deleting…');
    await api('/api/entry', 'DELETE', { collection: key, slug: entry.slug });
    status('Deleted · site rebuilt', 'ok');
    await load();
    render(true);
  } catch (e) {
    status('Delete failed: ' + e.message, 'err');
  }
}

async function load() {
  store = await api('/api/data');
}

// ── Theme toggle (same behavior as the public site) ──────────────────────
document.getElementById('adm-theme').addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  if (next === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// ── Boot ────────────────────────────────────────────────────────────────
(async function boot() {
  const onAdminServer = location.port === '8888' || location.host.includes('render.com') || location.host.includes('railway.app') || location.host.includes('localhost');
  
  function renderLogin() {
    const main = document.getElementById('adm-main');
    document.getElementById('adm-nav').innerHTML = '';
    
    const form = el('form', { class: 'adm-form', onsubmit: async (e) => {
      e.preventDefault();
      const user = document.getElementById('l-user').value || 'admin';
      const pass = document.getElementById('l-pass').value;
      localStorage.setItem('adm_auth', btoa(user + ':' + pass));
      try {
        await load();
        render();
      } catch (err) {
        if (err.message === '401') status('Incorrect password', 'err');
        else status('Error: ' + err.message, 'err');
      }
    } });

    form.append(el('div', { class: 'adm-head adm-head--form' }, 
      el('h1', {}, 'Admin Login')
    ));
    
    const fieldUser = el('div', { class: 'adm-field' },
      el('label', { for: 'l-user' }, 'Username'),
      el('input', { type: 'text', id: 'l-user', placeholder: 'admin' })
    );
    const fieldPass = el('div', { class: 'adm-field' },
      el('label', { for: 'l-pass' }, 'Password'),
      el('input', { type: 'password', id: 'l-pass', required: true })
    );
    
    form.append(fieldUser, fieldPass);
    form.append(el('div', { class: 'adm-form__actions' },
      el('button', { type: 'submit', class: 'btn btn--primary' }, 'Log In')
    ));
    
    main.innerHTML = '';
    main.append(form);
  }

  try {
    await load();
    render();
  } catch (e) {
    const main = document.getElementById('adm-main');
    if (e.message === '401') {
      renderLogin();
    } else if (!onAdminServer) {
      main.innerHTML =
        '<div class="adm-form"><h1 style="font-family:var(--font-display);font-style:italic">Open the admin from the right server</h1>' +
        '<p class="adm-head__sub">This page is being served from <code>' + location.host + '</code>, which has no editing API.</p>' +
        '<p class="adm-head__sub">Run <code>npm run admin</code> in your terminal, then open ' +
        '<a href="http://localhost:8888/admin/">http://localhost:8888/admin/</a> — that server has the read/write API.</p></div>';
    } else {
      main.innerHTML =
        '<div class="adm-form"><h1 style="font-family:var(--font-display);font-style:italic">Admin server not responding</h1>' +
        '<p class="adm-head__sub">The page loaded but the API call failed: ' + e.message + '. Try restarting <code>npm run admin</code>.</p></div>';
    }
  }
})();
