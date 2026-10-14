import { createApp } from './app.js';
import { createStore } from './store.js';
const port = Number(process.env.PORT || 3001);
const store = createStore();
// Purge withdrawn/expired candidate data at startup and once per day.
await store.update(() => {});
const maintenance = setInterval(() => store.update(() => {}).catch(error => console.error('[retention]', error)), 24 * 3600 * 1000);
maintenance.unref();
const app = createApp({ store });
app.listen(port, '0.0.0.0', () => console.log(`EMPLOIDIRECT listening on :${port}`));
