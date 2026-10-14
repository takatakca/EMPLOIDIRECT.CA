import { promises as fs } from 'node:fs';
import path from 'node:path';

const emptyData = () => ({ version: 1, users: [], sessions: [], jobs: [], applications: [] });

/**
 * Single-process JSON persistence for initial launch. Writes are serialized and
 * atomically renamed. Do not use across multiple server processes or replicas.
 * Store data outside the public web root; set DATA_DIR to a persistent directory.
 */
export function createStore(dir = process.env.DATA_DIR || '.data') {
  const file = path.resolve(dir, 'db.json');
  let ready;
  let queue = Promise.resolve();

  async function initialize() {
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    try { await fs.access(file); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      try { await fs.writeFile(file, JSON.stringify(emptyData(), null, 2), { flag: 'wx', mode: 0o600 }); }
      catch (writeError) { if (writeError.code !== 'EEXIST') throw writeError; }
    }
  }
  function ensure() { return (ready ??= initialize()); }
  async function readRaw() {
    await ensure();
    const data = JSON.parse(await fs.readFile(file, 'utf8'));
    if (data.version !== 1 || !Array.isArray(data.users) || !Array.isArray(data.jobs) || !Array.isArray(data.applications) || !Array.isArray(data.sessions)) {
      throw new Error('Unsupported or corrupted data file');
    }
    return data;
  }
  return {
    file,
    // Wait for in-progress writes to avoid reading partially updated state.
    async read() { await queue; return readRaw(); },
    async update(mutator) {
      const operation = queue.then(async () => {
        const data = await readRaw();
        // Delete candidate personal data after at most 180 days on each write.
        data.applications = data.applications.filter(row => Date.parse(row.createdAt) > Date.now() - 180 * 86400000);
        const result = await mutator(data);
        const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
        try {
          await fs.writeFile(temp, JSON.stringify(data, null, 2), { mode: 0o600, flag: 'wx' });
          await fs.rename(temp, file);
        } finally { await fs.rm(temp, { force: true }).catch(() => {}); }
        return result;
      });
      queue = operation.then(() => undefined, () => undefined);
      return operation;
    },
  };
}
