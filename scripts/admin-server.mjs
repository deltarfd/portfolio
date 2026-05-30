/**
 * Local admin save-server for the custom CMS.
 *
 * Serves the custom admin app and the project's static files, and exposes a
 * small JSON API to read/write the content files. Runs only on your machine —
 * there is no auth surface and nothing is deployed. After each write it
 * rebuilds the static site so _site stays fresh.
 *
 * Usage:  npm run admin   →  http://localhost:8888/admin/
 *
 * No external dependencies — uses Node built-ins only.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, statSync, mkdirSync } from 'node:fs';
import { resolve, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { execFile, exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const contentRoot = resolve(root, 'src', 'content');
const siteFile = resolve(root, 'src', 'content', 'site.json');
const PORT = process.env.PORT || 8888;

const COLLECTIONS = ['experience', 'projects', 'skills', 'certifications', 'awards', 'organizations', 'education'];

// Which field on each collection carries skill names (for auto-registration).
const SKILL_FIELD = { experience: 'technologies', projects: 'tech', certifications: 'skills' };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};

// Only allow writing inside src/content/<collection> or the site file.
function safeSlug(s) {
  return String(s).replace(/[^a-z0-9-]/gi, '').slice(0, 80);
}
function collectionDir(collection) {
  if (!COLLECTIONS.includes(collection)) return null;
  return resolve(contentRoot, collection);
}

function readCollection(collection) {
  const dir = collectionDir(collection);
  if (!dir || !existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ slug: f.replace(/\.json$/, ''), data: JSON.parse(readFileSync(resolve(dir, f), 'utf-8')) }));
}

let rebuildTimer = null;
let isRebuilding = false;
let rebuildPending = false;

function rebuild() {
  if (isRebuilding) {
    rebuildPending = true;
    return;
  }
  
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    isRebuilding = true;
    execFile('npx', ['@11ty/eleventy'], { cwd: root, shell: true }, (err) => {
      isRebuilding = false;
      if (err) console.error('[admin] rebuild failed:', err.message);
      else console.log('[admin] site rebuilt');
      
      if (rebuildPending) {
        rebuildPending = false;
        rebuild();
      }
    });
  }, 500);
}

async function gitSync(message) {
  if (process.env.NODE_ENV !== 'production') return;
  try {
    // 1. Sync Content Submodule (src/content)
    const contentDir = resolve(root, 'src', 'content');
    if (existsSync(join(contentDir, '.git'))) {
      if (process.env.CONTENT_GIT_REMOTE_URL) {
        await execAsync(`git remote set-url origin ${process.env.CONTENT_GIT_REMOTE_URL}`, { cwd: contentDir });
      }
      await execAsync('git config user.name "Admin Bot"', { cwd: contentDir });
      await execAsync('git config user.email "admin-bot@example.com"', { cwd: contentDir });
      await execAsync('git add .', { cwd: contentDir });
      try {
        await execAsync(`git commit -m "${message}"`, { cwd: contentDir });
        await execAsync('git push origin HEAD', { cwd: contentDir });
        console.log('[admin] Content Git sync successful');
      } catch (e) { /* ignore nothing to commit */ }
    }

    // 2. Sync Main Repository (for site.json and submodule reference)
    if (process.env.MAIN_GIT_REMOTE_URL) {
      await execAsync(`git remote set-url origin ${process.env.MAIN_GIT_REMOTE_URL}`, { cwd: root });
    }
    await execAsync('git config user.name "Admin Bot"', { cwd: root });
    await execAsync('git config user.email "admin-bot@example.com"', { cwd: root });
    await execAsync('git add src/content/site.json src/content', { cwd: root });
    try {
      await execAsync(`git commit -m "${message}"`, { cwd: root });
      await execAsync('git push origin HEAD', { cwd: root });
      console.log('[admin] Main Git sync successful');
    } catch (e) { /* ignore nothing to commit */ }

  } catch (e) {
    console.error('[admin] Git sync failed:', e.message);
  }
}

let syncPromise = Promise.resolve();
function queueGitSync(message) {
  syncPromise = syncPromise.then(() => gitSync(message)).catch(console.error);
}

/**
 * Ensure each skill name used by an entry exists in the Skills collection.
 * New skills are appended to the "Other Competencies" category (created if
 * absent). Returns the number of skills newly registered.
 */
function ensureSkills(names) {
  const list = (names || []).map((s) => String(s).trim()).filter(Boolean);
  if (!list.length) return 0;
  const dir = collectionDir('skills');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const cats = files.map((f) => ({ file: f, data: JSON.parse(readFileSync(resolve(dir, f), 'utf-8')) }));

  // Build a case-insensitive set of all existing skill names.
  const known = new Set();
  for (const c of cats) for (const s of (c.data.skills || [])) known.add(s.toLowerCase());

  const toAdd = list.filter((s) => !known.has(s.toLowerCase()));
  if (!toAdd.length) return 0;

  // Find (or create) the "Other Competencies" catch-all category.
  let other = cats.find((c) => /other/i.test(c.data.category || ''));
  if (!other) {
    const order = Math.max(0, ...cats.map((c) => c.data.order || 0)) + 1;
    other = { file: 'other-competencies.json', data: { order, category: 'Other Competencies', featured: false, skills: [] } };
    cats.push(other);
  }
  other.data.skills = [...(other.data.skills || []), ...toAdd];
  writeFileSync(resolve(dir, other.file), JSON.stringify(other.data, null, 2) + '\n', 'utf-8');
  return toAdd.length;
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((res) => {
    let data = '';
    let tooBig = false;
    const LIMIT = 12 * 1024 * 1024; // 12 MB — generous for a profile photo
    req.on('data', (c) => {
      data += c;
      if (data.length > LIMIT) { tooBig = true; req.destroy(); }
    });
    req.on('end', () => {
      if (tooBig) return res({ __error: 'payload too large' });
      try { res(data ? JSON.parse(data) : {}); } catch { res({}); }
    });
  });
}

function serveStatic(req, res, urlPath) {
  // Map URL to a file within the project root, with traversal protection.
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/admin' || rel === '/admin/') rel = '/admin/index.html';
  const filePath = normalize(join(root, rel));
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  // Prefer src/admin for /admin/* so we serve the source admin app directly.
  let target = filePath;
  if (rel.startsWith('/admin/')) {
    target = normalize(join(root, 'src', rel));
  } else if (rel.startsWith('/assets/media/')) {
    target = normalize(join(root, 'src', 'content', 'media', rel.replace(/^\/assets\/media\//, '')));
  } else {
    // Serve from _site by default for public web
    target = normalize(join(root, '_site', rel));
    if (existsSync(target) && statSync(target).isDirectory()) {
      target = join(target, 'index.html');
    }
  }
  if (!existsSync(target) || statSync(target).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
  const type = MIME[extname(target)] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(readFileSync(target));
}

const server = createServer(async (req, res) => {
  const { url, method, headers } = req;

  // ── Authentication ─────────────────────────────────────────────────────
  if (process.env.ADMIN_PASSWORD && url.startsWith('/api/')) {
    const auth = headers.authorization;
    if (!auth || auth.indexOf('Basic ') !== 0) {
      res.writeHead(401);
      res.end('Unauthorized');
      return;
    }
    const base64Credentials = auth.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    if (username !== expectedUser || password !== process.env.ADMIN_PASSWORD) {
      res.writeHead(401);
      res.end('Unauthorized');
      return;
    }
  }

  // ── API ──────────────────────────────────────────────────────────────
  if (url.startsWith('/api/')) {
    try {
      if (url === '/api/data' && method === 'GET') {
        const out = { site: JSON.parse(readFileSync(siteFile, 'utf-8')) };
        for (const c of COLLECTIONS) out[c] = readCollection(c);
        return sendJson(res, 200, out);
      }

      if (url === '/api/site' && method === 'PUT') {
        const body = await readBody(req);
        writeFileSync(siteFile, JSON.stringify(body.data, null, 2) + '\n', 'utf-8');
        rebuild();
        queueGitSync('Update site settings');
        return sendJson(res, 200, { ok: true });
      }

      if (url === '/api/entry' && method === 'POST') {
        const { collection, slug, data } = await readBody(req);
        const dir = collectionDir(collection);
        if (!dir) return sendJson(res, 400, { error: 'bad collection' });
        const name = safeSlug(slug) || ('entry-' + Date.now());
        writeFileSync(resolve(dir, name + '.json'), JSON.stringify(data, null, 2) + '\n', 'utf-8');
        // Auto-register any new skills used by this entry into the Skills collection.
        let addedSkills = 0;
        const skillField = SKILL_FIELD[collection];
        if (skillField && Array.isArray(data[skillField])) addedSkills = ensureSkills(data[skillField]);
        rebuild();
        queueGitSync(`Add/Update entry in ${collection}: ${name}`);
        return sendJson(res, 200, { ok: true, slug: name, addedSkills });
      }

      if (url === '/api/upload' && method === 'POST') {
        // Body: { filename, dataUrl }  (dataUrl = "data:<mime>;base64,<...>")
        const body = await readBody(req);
        if (body.__error) return sendJson(res, 413, { error: 'Image too large (max 12 MB).' });
        const { filename, dataUrl } = body;
        const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || '');
        if (!m) return sendJson(res, 400, { error: 'invalid image data' });
        const ext = (filename && filename.includes('.'))
          ? filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')
          : 'png';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(ext) ? ext : 'png';
        const safeName = 'profile.' + safeExt;
        const assetsDir = resolve(root, 'src', 'content', 'media');
        if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });
        writeFileSync(resolve(assetsDir, safeName), Buffer.from(m[2], 'base64'));
        rebuild();
        queueGitSync('Upload profile image');
        return sendJson(res, 200, { ok: true, path: 'assets/media/' + safeName });
      }

      if (url === '/api/upload' && method === 'DELETE') {
        // Remove any uploaded profile.* photo (reset to default/placeholder).
        const assetsDir = resolve(root, 'src', 'content', 'media');
        for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']) {
          const fp = resolve(assetsDir, 'profile.' + ext);
          if (existsSync(fp)) { try { unlinkSync(fp); } catch (e) { /* ignore */ } }
        }
        rebuild();
        queueGitSync('Delete profile image');
        return sendJson(res, 200, { ok: true });
      }

      if (url === '/api/media' && method === 'POST') {
        // Generic media upload — unique filename under assets/media/.
        // Body: { filename, dataUrl }  (dataUrl = "data:<mime>;base64,<...>")
        const body = await readBody(req);
        if (body.__error) return sendJson(res, 413, { error: 'Image too large (max 12 MB).' });
        const { filename, dataUrl } = body;
        const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || '');
        if (!m) return sendJson(res, 400, { error: 'invalid image data' });
        const rawExt = (filename && filename.includes('.'))
          ? filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')
          : 'png';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(rawExt) ? rawExt : 'png';
        const base = safeSlug((filename || 'image').replace(/\.[^.]+$/, '')) || 'image';
        const unique = `${base}-${Date.now().toString(36)}.${safeExt}`;
        const mediaDir = resolve(root, 'src', 'content', 'media');
        if (!existsSync(mediaDir)) mkdirSync(mediaDir, { recursive: true });
        writeFileSync(resolve(mediaDir, unique), Buffer.from(m[2], 'base64'));
        rebuild();
        queueGitSync(`Upload media: ${unique}`);
        return sendJson(res, 200, { ok: true, path: 'assets/media/' + unique });
      }

      if (url === '/api/entry' && method === 'DELETE') {
        const { collection, slug } = await readBody(req);
        const dir = collectionDir(collection);
        if (!dir) return sendJson(res, 400, { error: 'bad collection' });
        const file = resolve(dir, safeSlug(slug) + '.json');
        if (existsSync(file)) unlinkSync(file);
        rebuild();
        queueGitSync(`Delete entry from ${collection}: ${slug}`);
        return sendJson(res, 200, { ok: true });
      }

      if (url === '/api/reorder' && method === 'POST') {
        // Body: { collection, slugs: [...] } — writes order = index+1 to each
        // entry in the given sequence, then rebuilds once.
        const { collection, slugs } = await readBody(req);
        const dir = collectionDir(collection);
        if (!dir) return sendJson(res, 400, { error: 'bad collection' });
        if (!Array.isArray(slugs)) return sendJson(res, 400, { error: 'slugs must be an array' });
        let written = 0;
        slugs.forEach((slug, i) => {
          const file = resolve(dir, safeSlug(slug) + '.json');
          if (existsSync(file)) {
            const data = JSON.parse(readFileSync(file, 'utf-8'));
            data.order = i + 1;
            writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
            written++;
          }
        });
        rebuild();
        queueGitSync(`Reorder collection: ${collection}`);
        return sendJson(res, 200, { ok: true, written });
      }

      return sendJson(res, 404, { error: 'unknown endpoint' });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // ── Static ───────────────────────────────────────────────────────────
  serveStatic(req, res, url);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use — an admin server is probably already running.\n  Open http://localhost:${PORT}/admin/ in your browser, or stop the other process and retry.\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`\n  Custom admin running:  http://localhost:${PORT}/admin/\n  Edits write to src/content + src/_data, then rebuild _site.\n  Press Ctrl+C to stop.\n`);
});
