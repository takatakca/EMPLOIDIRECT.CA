import test from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresStore } from '../server/postgres-store.js';

const connectionString = process.env.TEST_DATABASE_URL;

test('real PostgreSQL: row-level serialization, rollback, and 180-day retention', {
  skip: !connectionString && 'TEST_DATABASE_URL not configured',
  timeout: 30000,
}, async () => {
  const parsed = new URL(connectionString);
  // Only allow a dedicated, ephemeral CI test database. Never point this at a live DB.
  if (parsed.pathname !== '/emploidirect_ci' || !['127.0.0.1', 'localhost', 'postgres'].includes(parsed.hostname)) {
    throw new Error('Integration test requires a local emploidirect_ci database; refusing to touch another database');
  }
  const first = createPostgresStore({ connectionString });
  const second = createPostgresStore({ connectionString });
  try {
    const initial = await first.read();
    assert.equal(initial.version, 1);
    assert.deepEqual(initial.users, []);
    const updateOne = (store, index) => store.update(async data => {
      const prior = data.users.length;
      await new Promise(resolve => setTimeout(resolve, index % 3));
      data.users.push({ id: 'ci-user-' + index });
      return prior;
    });
    const results = await Promise.all(Array.from({ length: 16 }, (_, i) =>
      updateOne(i % 2 ? first : second, i)
    ));
    assert.deepEqual([...results].sort((a, b) => a - b), Array.from({ length: 16 }, (_, i) => i));
    assert.equal((await second.read()).users.length, 16);
    await assert.rejects(first.update(data => {
      data.users.push({ id: 'must-rollback' });
      throw new Error('intentional rollback');
    }), /intentional rollback/);
    assert.equal((await second.read()).users.length, 16);
    await first.update(data => {
      data.applications.push({ id: 'expired', createdAt: new Date(Date.now() - 181 * 86400000).toISOString() });
      data.applications.push({ id: 'recent', createdAt: new Date().toISOString() });
    });
    await second.update(() => {});
    assert.deepEqual((await first.read()).applications.map(a => a.id), ['recent']);
  } finally {
    await Promise.all([first.close(), second.close()]);
  }
});
