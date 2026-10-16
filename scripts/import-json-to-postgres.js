import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createPostgresStore, validateData } from '../server/postgres-store.js';

const filename = process.argv[2];
if (!filename || process.argv[3] !== '--confirm' || !process.env.DATABASE_URL) {
  console.error('Usage: DATABASE_URL=... node scripts/import-json-to-postgres.js /secure/path/db.json --confirm');
  console.error('Make a verified JSON backup and a PostgreSQL backup before running. Target must be empty.');
  process.exit(2);
}
const content = validateData(JSON.parse(await readFile(path.resolve(filename), 'utf8')));
const store = createPostgresStore();
try {
  await store.update(target => {
    if (['users', 'sessions', 'jobs', 'applications'].some(key => target[key].length > 0)) {
      throw new Error('Destination database is not empty; refusing to overwrite data');
    }
    for (const key of ['users', 'sessions', 'jobs', 'applications']) target[key] = content[key];
  });
  console.log('Import committed. Verify records, permissions and privacy retention before switching traffic.');
} finally {
  await store.close();
}
