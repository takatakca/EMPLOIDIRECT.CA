import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createApp } from '../server/app.js';
import { createStore } from '../server/store.js';

async function setup(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'emploidirect-test-'));
  const store = createStore(dir);
  const server = await new Promise(resolve => { const http = createApp({ store, production: false, serveFrontend: false }).listen(0, '127.0.0.1', () => resolve(http)); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); });
  const url = `http://127.0.0.1:${server.address().port}`;
  async function call(endpoint, { method = 'GET', body, cookie } = {}) {
    const result = await fetch(url + endpoint, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: result.status, data: await result.json(), cookie: result.headers.get('set-cookie')?.split(';')[0] };
  }
  return { store, call };
}
const offer = { title: 'Développeuse full-stack', location: 'Montréal, Québec', category: 'Technologie', type: 'Temps plein', mode: 'Hybride', description: 'Développer une solution de gestion pour les clients, collaborer avec les équipes et maintenir des normes de qualité.', salaryMin: 75000, salaryMax: 95000, tags: ['React', 'Node'] };

test('registration, moderation, publication, applications, withdrawal and tenant isolation', async t => {
  const { store, call } = await setup(t);
  assert.equal((await call('/api/health')).data.ok, true);
  assert.equal((await call('/api/jobs')).data.total, 0);
  const employer = { name: 'Alice Martin', company: 'Exemple Québec', email: 'alice@example.ca', password: 'verystrongpassword123' };
  assert.equal((await call('/api/auth/register', { method: 'POST', body: employer })).status, 201);
  assert.equal((await call('/api/auth/register', { method: 'POST', body: employer })).status, 409);
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { email: employer.email, password: 'badpassword' } })).status, 401);
  const login = await call('/api/auth/login', { method: 'POST', body: employer });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.approved, false);
  const cookie = login.cookie;
  assert.ok(cookie?.startsWith('ed_session='));
  assert.equal((await call('/api/employer/jobs')).status, 401);
  const created = await call('/api/employer/jobs', { method: 'POST', body: offer, cookie });
  assert.equal(created.status, 201);
  const jobId = created.data.job.id;
  assert.equal((await call(`/api/employer/jobs/${jobId}/publish`, { method: 'POST', cookie })).status, 403);
  assert.equal((await call('/api/jobs')).data.total, 0);
  await store.update(db => { db.users[0].approved = true; });
  assert.equal((await call(`/api/employer/jobs/${jobId}/publish`, { method: 'POST', cookie })).status, 200);
  const listing = await call('/api/jobs?q=full-stack&location=montr%C3%A9al&category=Technologie');
  assert.equal(listing.data.total, 1);
  assert.equal(listing.data.jobs[0].employerId, undefined);
  const application = await call(`/api/jobs/${jobId}/applications`, { method: 'POST', body: { name: 'Camille Dupont', email: 'camille@example.ca', message: 'Je souhaite soumettre ma candidature parce que j’ai plusieurs années d’expérience en développement.', resumeUrl: '', consent: true } });
  assert.equal(application.status, 201);
  assert.ok(application.data.withdrawal.token);
  const employerInbox = await call('/api/employer/applications', { cookie });
  assert.equal(employerInbox.data.applications.length, 1);
  assert.equal(employerInbox.data.applications[0].withdrawalHash, undefined);
  const outsider = { ...employer, email: 'other@example.ca', company: 'Autre inc' };
  assert.equal((await call('/api/auth/register', { method: 'POST', body: outsider })).status, 201);
  const secondLogin = await call('/api/auth/login', { method: 'POST', body: outsider });
  assert.equal((await call('/api/employer/applications', { cookie: secondLogin.cookie })).data.applications.length, 0);
  assert.equal((await call(`/api/employer/jobs/${jobId}/unpublish`, { method: 'POST', cookie: secondLogin.cookie })).status, 404);
  assert.equal((await call('/api/applications/withdraw', { method: 'POST', body: { id: application.data.withdrawal.id, token: 'wrong' } })).status, 404);
  assert.equal((await call('/api/applications/withdraw', { method: 'POST', body: application.data.withdrawal })).status, 200);
  assert.equal((await call('/api/employer/applications', { cookie })).data.applications.length, 0);
  assert.equal((await call(`/api/employer/jobs/${jobId}/unpublish`, { method: 'POST', cookie })).status, 200);
  assert.equal((await call('/api/jobs')).data.total, 0);
  assert.equal((await call(`/api/jobs/${jobId}/applications`, { method: 'POST', body: { name: 'Foo', email: 'foo@example.ca', message: 'Je vous écris pour vous faire parvenir ma candidature pour votre offre.', consent: true } })).status, 404);
  assert.equal((await call('/api/auth/logout', { method: 'POST', cookie })).status, 200);
  assert.equal((await call('/api/auth/me', { cookie })).data.user, null);
});

test('input validation and origin restrictions', async t => {
  const { call } = await setup(t);
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { email: 'bad', password: 'bad' } })).status, 400);
  assert.equal((await call('/api/jobs?category=Invalid')).data.total, 0);
  assert.equal((await call('/api/no-such-route')).status, 404);
  assert.equal((await call('/api/jobs/nope')).status, 404);
  assert.equal((await call('/api/employer/jobs', { method: 'POST', body: offer })).status, 401);
});

test('retention removes old applications on maintenance write', async t => {
  const { store } = await setup(t);
  await store.update(db => db.applications.push({ id: 'old', createdAt: new Date(Date.now() - 190 * 86400000).toISOString() }));
  await store.update(() => {});
  assert.equal((await store.read()).applications.length, 0);
});


test('read-only preview blocks writes while keeping job search available', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'emploidirect-preview-test-'));
  const server = await new Promise(resolve => { const http = createApp({ store: createStore(dir), production: false, previewReadOnly: true, serveFrontend: false }).listen(0, '127.0.0.1', () => resolve(http)); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); });
  const url = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(url + '/api/jobs')).status, 200);
  const response = await fetch(url + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  assert.equal(response.status, 503);
});
