import { readFileSync } from 'node:fs';
import { Pool } from 'pg';

const emptyData = () => ({ version: 1, users: [], sessions: [], jobs: [], applications: [] });
const RETENTION_MS = 180 * 86400000;

export function validateData(data) {
  if (!data || data.version !== 1 || !['users', 'sessions', 'jobs', 'applications'].every(key => Array.isArray(data[key]))) {
    throw new Error('Unsupported or corrupted employment data');
  }
  return data;
}

/**
 * PostgreSQL-backed single-state store. A row-level lock makes updates atomic
 * across processes. This compatibility adapter deliberately keeps v1's data
 * contract; a later relational migration will be needed for high throughput.
 */
export function createPostgresStore({ connectionString = process.env.DATABASE_URL, pool } = {}) {
  if (!pool && !connectionString) throw new Error('DATABASE_URL is required for PostgreSQL storage');

  const caFile = process.env.DATABASE_SSL_CA_FILE;
  const clientPool = pool || new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ...(caFile ? { ssl: { ca: readFileSync(caFile, 'utf8'), rejectUnauthorized: true } } : {}),
  });
  let ready;

  async function initialize() {
    await clientPool.query(
      'CREATE TABLE IF NOT EXISTS emploidirect_state (' +
      'singleton_id SMALLINT PRIMARY KEY CHECK (singleton_id = 1), ' +
      'data JSONB NOT NULL, ' +
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT now())'
    );
    await clientPool.query(
      'INSERT INTO emploidirect_state (singleton_id, data) VALUES (1, $1::jsonb) ON CONFLICT (singleton_id) DO NOTHING',
      [JSON.stringify(emptyData())]
    );
  }
  const ensure = () => (ready ??= initialize());

  return {
    backend: 'postgres',
    async read() {
      await ensure();
      const result = await clientPool.query('SELECT data FROM emploidirect_state WHERE singleton_id = 1');
      if (result.rows.length !== 1) throw new Error('PostgreSQL state is missing');
      return validateData(result.rows[0].data);
    },
    async update(mutator) {
      await ensure();
      const client = await clientPool.connect();
      let inTransaction = false;
      try {
        await client.query('BEGIN');
        inTransaction = true;
        const result = await client.query('SELECT data FROM emploidirect_state WHERE singleton_id = 1 FOR UPDATE');
        if (result.rows.length !== 1) throw new Error('PostgreSQL state is missing');
        const data = validateData(result.rows[0].data);
        data.applications = data.applications.filter(row => Date.parse(row.createdAt) > Date.now() - RETENTION_MS);
        const output = await mutator(data);
        validateData(data);
        await client.query('UPDATE emploidirect_state SET data = $1::jsonb, updated_at = now() WHERE singleton_id = 1', [JSON.stringify(data)]);
        await client.query('COMMIT');
        inTransaction = false;
        return output;
      } catch (error) {
        if (inTransaction) {
          try { await client.query('ROLLBACK'); } catch (rollbackError) { console.error('[emploidirect] rollback failed', rollbackError); }
        }
        throw error;
      } finally {
        client.release();
      }
    },
    async close() { await clientPool.end(); },
  };
}
