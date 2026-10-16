import test from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresStore, validateData } from '../server/postgres-store.js';

const empty = () => ({ version: 1, users: [], sessions: [], jobs: [], applications: [] });

test('PostgreSQL requires a configured URL or a database pool', () => {
  assert.throws(() => createPostgresStore({ connectionString: '' }), /DATABASE_URL/);
});

test('invalid and incompatible database payloads are rejected', () => {
  assert.throws(() => validateData({ version: 2 }), /corrupted/);
  assert.throws(() => validateData({ ...empty(), jobs: null }), /corrupted/);
  assert.equal(validateData(empty()).version, 1);
});

test('PostgreSQL transactions commit changes, apply retention and roll back errors', async () => {
  let state = empty();
  let pending = null;
  const queries = [];
  const client = {
    async query(sql, params) {
      queries.push(sql);
      if (sql === 'BEGIN') { pending = structuredClone(state); return { rows: [] }; }
      if (sql.includes('FOR UPDATE')) return { rows: [{ data: structuredClone(pending) }] };
      if (sql.startsWith('UPDATE ')) { pending = JSON.parse(params[0]); return { rows: [] }; }
      if (sql === 'COMMIT') { state = pending; pending = null; return { rows: [] }; }
      if (sql === 'ROLLBACK') { pending = null; return { rows: [] }; }
      throw new Error('Unexpected SQL: ' + sql);
    },
    release() {},
  };
  const pool = {
    async query(sql) {
      queries.push(sql);
      if (sql.startsWith('SELECT ')) return { rows: [{ data: structuredClone(state) }] };
      return { rows: [] };
    },
    async connect() { return client; },
    async end() {},
  };
  const store = createPostgresStore({ pool });
  await store.update(data => {
    data.users.push({ id: 'test-user' });
    data.applications.push({ id: 'expired', createdAt: new Date(Date.now() - 190 * 86400000).toISOString() });
    return true;
  });
  assert.equal((await store.read()).users[0].id, 'test-user');
  await store.update(() => {});
  assert.equal((await store.read()).applications.length, 0);
  await assert.rejects(store.update(data => {
    data.users.push({ id: 'must-roll-back' });
    throw new Error('test failure');
  }), /test failure/);
  assert.equal((await store.read()).users.length, 1);
  assert.ok(queries.includes('ROLLBACK'));
  await store.close();
});
