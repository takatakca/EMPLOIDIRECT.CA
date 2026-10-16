import { createApp } from './app.js';
import { createStore } from './store.js';
import { createPostgresStore } from './postgres-store.js';
const port = Number(process.env.PORT || 3001);
if (process.env.NODE_ENV === 'production' && process.env.PREVIEW_READ_ONLY !== 'true' && !process.env.DATABASE_URL) {
  throw new Error('Production requires DATABASE_URL; local JSON data is not safe for commercial hosting');
}
const store = process.env.DATABASE_URL ? createPostgresStore() : createStore();
// Purge withdrawn/expired candidate data at startup and once per day.
await store.update(() => {});
const maintenance = setInterval(() => store.update(() => {}).catch(error => console.error('[retention]', error)), 24 * 3600 * 1000);
maintenance.unref();
const app = createApp({ store });
app.listen(port, '0.0.0.0', () => console.log(`EMPLOIDIRECT listening on :${port}`));
