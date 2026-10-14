import { createStore } from '../server/store.js';
import { normalizeEmail } from '../server/security.js';

const email = normalizeEmail(process.argv[2]);
if (!email) { console.error('Usage: npm run approve:employer -- adresse@entreprise.ca'); process.exit(1); }
const result = await createStore().update(db => {
  const user = db.users.find(item => item.email === email);
  if (!user) return false;
  user.approved = true;
  return true;
});
if (!result) { console.error('Compte introuvable.'); process.exit(1); }
console.log(`Employeur vérifié : ${email}`);
