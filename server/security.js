import crypto from 'node:crypto';

export const token = () => crypto.randomBytes(32).toString('base64url');
export const digest = value => crypto.createHash('sha256').update(value).digest('hex');
export const normalizeEmail = value => String(value || '').trim().toLowerCase();
export const clean = (value, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
export const validUrl = value => {
  if (!value) return true;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !!url.hostname; }
  catch { return false; }
};

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${key}`;
}
export function verifyPassword(password, hash = '') {
  const [salt, expected] = hash.split(':');
  if (!salt || !expected || !/^[0-9a-f]{128}$/.test(expected)) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export function publicUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, company: user.company, approved: user.approved };
}
export function publicJob(job) {
  const { employerId, ...visible } = job;
  return visible;
}
export function cookieOptions(secure) {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 7 * 24 * 3600 * 1000 };
}
export const categories = ['Technologie', 'Administration', 'Santé', 'Construction', 'Vente', 'Transport', 'Restauration', 'Éducation', 'Autre'];
export const types = ['Temps plein', 'Temps partiel', 'Contrat', 'Stage', 'Temporaire'];
export const modes = ['Sur place', 'Hybride', 'Télétravail'];
