import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createStore } from './store.js';
import { token, digest, normalizeEmail, clean, validEmail, validUrl, hashPassword, verifyPassword, publicUser, publicJob, cookieOptions, categories, types, modes } from './security.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 80;
const MAX_JSON = '32kb';
const sessionDays = 7;
const now = () => new Date().toISOString();
const badRequest = (res, message, code = 400) => res.status(code).json({ error: message });
const allowed = (v, arr) => arr.includes(v);
const safeText = (value, max, min = 1) => {
  const text = clean(value, max + 1);
  return text.length >= min && text.length <= max ? text : null;
};

/** Configure APP_ORIGIN in production (e.g. https://emploidirect.ca). */
export function createApp({ store = createStore(), production = process.env.NODE_ENV === 'production', origin = process.env.APP_ORIGIN, previewReadOnly = process.env.PREVIEW_READ_ONLY === 'true', serveFrontend = true } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  app.use(express.json({ limit: MAX_JSON }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('X-Frame-Options', 'DENY');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (production) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  });
  // Cross-origin POST/PUT/PATCH/DELETE requests are blocked (cookies are SameSite=Lax too).
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (previewReadOnly) return badRequest(res, 'Mode aperçu : actions désactivées.', 503);
    const requestOrigin = req.get('origin');
    if (production && !origin) return badRequest(res, 'APP_ORIGIN doit être configuré.', 503);
    if (requestOrigin && origin && requestOrigin !== origin) return badRequest(res, 'Origine non autorisée.', 403);
    if (production && !requestOrigin) return badRequest(res, 'Origine requise.', 403);
    next();
  });
  const attempts = new Map();
  const rateLimit = (scope, max, windowMs) => (req, res, next) => {
    const key = `${scope}:${req.ip}`;
    const current = Date.now();
    const item = attempts.get(key) || { until: current + windowMs, count: 0 };
    if (item.until < current) { item.until = current + windowMs; item.count = 0; }
    item.count += 1;
    attempts.set(key, item);
    if (attempts.size > 5000) for (const [k, v] of attempts) if (v.until < current) attempts.delete(k);
    if (item.count > max) return badRequest(res, 'Trop de tentatives, veuillez réessayer plus tard.', 429);
    next();
  };
  const getCookie = req => {
    const match = /(?:^|;\s*)ed_session=([^;]+)/.exec(req.headers.cookie || '');
    return match ? decodeURIComponent(match[1]) : null;
  };
  async function getAccount(req) {
    const id = getCookie(req);
    if (!id) return null;
    const data = await store.read();
    const session = data.sessions.find(row => row.hash === digest(id) && row.expiresAt > Date.now());
    return session ? data.users.find(user => user.id === session.userId) || null : null;
  }
  const authenticated = async (req, res, next) => {
    try { req.account = await getAccount(req); if (!req.account) return badRequest(res, 'Connexion requise.', 401); next(); }
    catch (error) { next(error); }
  };
  app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'emploidirect', at: now() }));
  app.get('/api/meta', (_req, res) => res.json({ categories, types, modes }));
  app.get('/api/jobs', async (req, res, next) => {
    try {
      const data = await store.read();
      let jobs = data.jobs.filter(job => job.status === 'published');
      const term = clean(req.query.q, LIMIT).toLocaleLowerCase('fr-CA');
      const where = clean(req.query.location, LIMIT).toLocaleLowerCase('fr-CA');
      const category = clean(req.query.category, LIMIT);
      const type = clean(req.query.type, LIMIT);
      const mode = clean(req.query.mode, LIMIT);
      if (term) jobs = jobs.filter(job => [job.title, job.company, job.description, ...job.tags].join(' ').toLocaleLowerCase('fr-CA').includes(term));
      if (where) jobs = jobs.filter(job => job.location.toLocaleLowerCase('fr-CA').includes(where));
      if (category) jobs = jobs.filter(job => job.category === category);
      if (type) jobs = jobs.filter(job => job.type === type);
      if (mode) jobs = jobs.filter(job => job.mode === mode);
      jobs.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      const page = Math.max(1, Math.min(1000, Number.parseInt(req.query.page, 10) || 1));
      const perPage = 12;
      res.json({ jobs: jobs.slice((page - 1) * perPage, page * perPage).map(publicJob), total: jobs.length, page, perPage });
    } catch (error) { next(error); }
  });
  app.get('/api/jobs/:id', async (req, res, next) => {
    try {
      const job = (await store.read()).jobs.find(item => item.id === req.params.id && item.status === 'published');
      if (!job) return badRequest(res, 'Offre introuvable.', 404);
      res.json({ job: publicJob(job) });
    } catch (error) { next(error); }
  });
  app.post('/api/auth/register', rateLimit('register', 8, 3600000), async (req, res, next) => {
    try {
      const name = safeText(req.body?.name, 100, 2);
      const company = safeText(req.body?.company, 130, 2);
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      if (!name || !company || !validEmail(email) || typeof password !== 'string' || password.length < 12 || password.length > 128)
        return badRequest(res, 'Nom, entreprise, courriel et mot de passe (12 caractères minimum) requis.');
      const user = { id: crypto.randomUUID(), name, company, email, passwordHash: hashPassword(password), approved: false, createdAt: now() };
      const inserted = await store.update(data => {
        if (data.users.some(item => item.email === email)) return false;
        data.users.push(user); return true;
      });
      if (!inserted) return badRequest(res, 'Ce courriel est déjà utilisé.', 409);
      res.status(201).json({ message: 'Compte créé. Vérification de l’entreprise en attente.', user: publicUser(user) });
    } catch (error) { next(error); }
  });
  app.post('/api/auth/login', rateLimit('login', 12, 15 * 60000), async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      const data = await store.read();
      const user = data.users.find(item => item.email === email);
      if (typeof password !== 'string' || password.length > 128 || !user || !verifyPassword(password, user.passwordHash))
        return badRequest(res, 'Identifiants invalides.', 401);
      const sessionToken = token();
      await store.update(db => {
        db.sessions = db.sessions.filter(item => item.expiresAt > Date.now() && item.userId !== user.id);
        db.sessions.push({ hash: digest(sessionToken), userId: user.id, expiresAt: Date.now() + sessionDays * 86400000 });
      });
      res.cookie('ed_session', sessionToken, cookieOptions(production));
      res.json({ user: publicUser(user) });
    } catch (error) { next(error); }
  });
  app.get('/api/auth/me', async (req, res, next) => {
    try { res.json({ user: publicUser(await getAccount(req)) }); } catch (error) { next(error); }
  });
  app.post('/api/auth/logout', async (req, res, next) => {
    try {
      const current = getCookie(req);
      if (current) await store.update(data => { data.sessions = data.sessions.filter(item => item.hash !== digest(current)); });
      res.clearCookie('ed_session', { path: '/', sameSite: 'lax', secure: production });
      res.json({ ok: true });
    } catch (error) { next(error); }
  });
  app.get('/api/employer/jobs', authenticated, async (req, res, next) => {
    try { res.json({ jobs: (await store.read()).jobs.filter(job => job.employerId === req.account.id) }); }
    catch (error) { next(error); }
  });
  app.get('/api/employer/applications', authenticated, async (req, res, next) => {
    try {
      const db = await store.read();
      const ids = new Set(db.jobs.filter(job => job.employerId === req.account.id).map(job => job.id));
      res.json({ applications: db.applications.filter(application => ids.has(application.jobId)).map(({ withdrawalHash, ...visible }) => visible) });
    } catch (error) { next(error); }
  });
  function parseJob(input) {
    const title = safeText(input?.title, 120, 5);
    const location = safeText(input?.location, 100, 2);
    const category = input?.category;
    const type = input?.type;
    const mode = input?.mode;
    const description = safeText(input?.description, 6000, 50);
    const salaryMin = input?.salaryMin === '' || input?.salaryMin == null ? null : Number(input.salaryMin);
    const salaryMax = input?.salaryMax === '' || input?.salaryMax == null ? null : Number(input.salaryMax);
    const tags = Array.isArray(input?.tags) ? [...new Set(input.tags.map(t => clean(t, 35)).filter(Boolean))].slice(0, 6) : [];
    if (!title || !location || !description || !allowed(category, categories) || !allowed(type, types) || !allowed(mode, modes)) return null;
    if ([salaryMin, salaryMax].some(salary => salary != null && (!Number.isInteger(salary) || salary < 0 || salary > 10000000))) return null;
    if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) return null;
    return { title, location, category, type, mode, description, salaryMin, salaryMax, tags };
  }
  app.post('/api/employer/jobs', authenticated, rateLimit('jobs', 30, 3600000), async (req, res, next) => {
    try {
      const input = parseJob(req.body);
      if (!input) return badRequest(res, 'Veuillez remplir correctement les détails de l’offre.');
      const job = { id: crypto.randomUUID(), employerId: req.account.id, company: req.account.company, ...input, status: 'draft', createdAt: now(), updatedAt: now(), publishedAt: null };
      await store.update(db => db.jobs.push(job));
      res.status(201).json({ job });
    } catch (error) { next(error); }
  });
  app.put('/api/employer/jobs/:id', authenticated, async (req, res, next) => {
    try {
      const input = parseJob(req.body);
      if (!input) return badRequest(res, 'Détails de l’offre invalides.');
      const updated = await store.update(db => {
        const job = db.jobs.find(item => item.id === req.params.id && item.employerId === req.account.id);
        if (!job) return null;
        Object.assign(job, input, { updatedAt: now(), status: 'draft', publishedAt: null });
        return job;
      });
      if (!updated) return badRequest(res, 'Offre introuvable.', 404);
      res.json({ job: updated });
    } catch (error) { next(error); }
  });
  app.post('/api/employer/jobs/:id/publish', authenticated, async (req, res, next) => {
    try {
      if (!req.account.approved) return badRequest(res, 'Entreprise en attente de vérification.', 403);
      const updated = await store.update(db => {
        const job = db.jobs.find(item => item.id === req.params.id && item.employerId === req.account.id);
        if (!job) return null;
        job.status = 'published'; job.publishedAt = now(); job.updatedAt = now(); return job;
      });
      if (!updated) return badRequest(res, 'Offre introuvable.', 404);
      res.json({ job: updated });
    } catch (error) { next(error); }
  });
  app.post('/api/employer/jobs/:id/unpublish', authenticated, async (req, res, next) => {
    try {
      const updated = await store.update(db => {
        const job = db.jobs.find(item => item.id === req.params.id && item.employerId === req.account.id);
        if (!job) return null;
        job.status = 'draft'; job.publishedAt = null; job.updatedAt = now(); return job;
      });
      if (!updated) return badRequest(res, 'Offre introuvable.', 404);
      res.json({ job: updated });
    } catch (error) { next(error); }
  });
  app.post('/api/jobs/:id/applications', rateLimit('apply', 15, 3600000), async (req, res, next) => {
    try {
      // Honeypot: suspicious submissions get no stored data.
      if (req.body?.website) return res.status(202).json({ ok: true });
      const name = safeText(req.body?.name, 100, 2);
      const email = normalizeEmail(req.body?.email);
      const message = safeText(req.body?.message, 3000, 30);
      const resumeUrl = clean(req.body?.resumeUrl || '', 400);
      if (!name || !validEmail(email) || !message || !validUrl(resumeUrl) || req.body?.consent !== true)
        return badRequest(res, 'Nom, courriel, message, consentement et lien CV valide requis.');
      const withdrawalToken = token();
      const application = { id: crypto.randomUUID(), jobId: req.params.id, name, email, message, resumeUrl, createdAt: now(), withdrawalHash: digest(withdrawalToken) };
      const found = await store.update(db => {
        if (!db.jobs.some(job => job.id === req.params.id && job.status === 'published')) return false;
        db.applications.push(application); return true;
      });
      if (!found) return badRequest(res, 'Cette offre n’accepte plus de candidatures.', 404);
      res.status(201).json({ ok: true, message: 'Candidature reçue par l’entreprise.', withdrawal: { id: application.id, token: withdrawalToken } });
    } catch (error) { next(error); }
  });
  app.post('/api/applications/withdraw', rateLimit('withdraw', 25, 3600000), async (req, res, next) => {
    try {
      const id = clean(req.body?.id, 100);
      const secret = clean(req.body?.token, 200);
      if (!id || !secret) return badRequest(res, 'Lien de retrait invalide.', 400);
      const removed = await store.update(db => {
        const before = db.applications.length;
        db.applications = db.applications.filter(item => !(item.id === id && item.withdrawalHash === digest(secret)));
        return db.applications.length !== before;
      });
      if (!removed) return badRequest(res, 'Candidature introuvable ou déjà retirée.', 404);
      res.json({ ok: true });
    } catch (error) { next(error); }
  });
  app.use('/api', (_req, res) => badRequest(res, 'Point d’accès introuvable.', 404));
  if (serveFrontend) {
    app.use(express.static(path.join(rootDir, 'dist'), { maxAge: production ? '1h' : 0, index: 'index.html' }));
    app.get('*', (_req, res) => res.sendFile(path.join(rootDir, 'dist', 'index.html')));
  }
  // Never leak stack traces to visitors.
  app.use((err, _req, res, _next) => {
    console.error('[emploidirect]', err);
    if (err.type === 'entity.too.large') return badRequest(res, 'Contenu trop volumineux.', 413);
    if (err.type === 'entity.parse.failed') return badRequest(res, 'JSON invalide.', 400);
    return badRequest(res, 'Erreur interne. Veuillez réessayer.', 500);
  });
  return app;
}
