import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, Building2, Check, CheckCircle2, ChevronDown, Clock3, FileText, Filter, Globe2, HeartHandshake, Laptop, LockKeyhole, LogOut, Mail, MapPin, Menu, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react';
import { api } from './api';
import type { Account, Application, FormJob, Job } from './types';

const PREVIEW_ONLY = import.meta.env.VITE_PREVIEW_ONLY === 'true';
const categories = ['Tous les secteurs', 'Technologie', 'Administration', 'Santé', 'Construction', 'Vente', 'Transport', 'Restauration', 'Éducation', 'Autre'];
const types = ['Tous les contrats', 'Temps plein', 'Temps partiel', 'Contrat', 'Stage', 'Temporaire'];
const modes = ['Tous les modes', 'Sur place', 'Hybride', 'Télétravail'];
const categoryCards = [
  { name: 'Technologie', icon: Laptop, note: 'Numérique & innovation' },
  { name: 'Santé', icon: HeartHandshake, note: 'Soins & services' },
  { name: 'Administration', icon: FileText, note: 'Bureaux & gestion' },
  { name: 'Construction', icon: Building2, note: 'Métiers & chantiers' },
];
const initialForm: FormJob = { title: '', location: '', category: 'Technologie', type: 'Temps plein', mode: 'Sur place', description: '', salaryMin: null, salaryMax: null, tags: [] };
const money = (value: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
const when = (date: string | null) => date ? new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(date)) : '';
function IconBrand() {
  return <span className="brandmark"><span className="mark"><span /><span /><span /></span><span className="brandword">EMPLOI<span>DIRECT</span><small>.CA</small></span></span>;
}
function ActionButton({ children, onClick, variant = 'primary', type = 'button', disabled = false }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'line'; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button className={`btn btn-${variant}`} onClick={onClick} type={type} disabled={disabled}>{children}</button>;
}
function Pill({ children }: { children: ReactNode }) { return <span className="pill">{children}</span>; }
function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return <div className="empty"><div className="empty-icon"><Search size={30} /></div><h3>{title}</h3><p>{text}</p>{children}</div>;
}
function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', keydown); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-top"><strong>{title}</strong><button type="button" onClick={onClose} className="icon-button" aria-label="Fermer"><X size={20} /></button></div>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
function JobCard({ job, saved, toggleSave, open }: { job: Job; saved: boolean; toggleSave: () => void; open: () => void }) {
  return <article className="job-card">
    <div className="job-head"><div className="company-icon">{job.company.slice(0, 1).toLocaleUpperCase('fr-CA')}</div><div className="job-head-main"><span className="job-company">{job.company}</span><h3><button className="text-button" onClick={open}>{job.title}</button></h3></div><button type="button" className={`save-button ${saved ? 'selected' : ''}`} onClick={toggleSave} aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'} title={saved ? 'Retirer des favoris' : 'Sauvegarder l’offre'}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} /></button></div>
    <div className="job-metadata"><span><MapPin size={15} /> {job.location}</span><span><BriefcaseBusiness size={15} /> {job.type}</span><span><Globe2 size={15} /> {job.mode}</span></div>
    <div className="job-tags"><Pill>{job.category}</Pill>{job.tags.slice(0, 2).map(tag => <Pill key={tag}>{tag}</Pill>)}</div>
    <div className="job-footer"><div><strong>{job.salaryMin != null ? `${money(job.salaryMin)}${job.salaryMax != null ? ` – ${money(job.salaryMax)}` : ' et +'}` : 'Salaire à discuter'}</strong><span>Publié le {when(job.publishedAt)}</span></div><button className="job-arrow" type="button" aria-label={`Voir l’offre ${job.title}`} onClick={open}><ArrowUpRight size={22} /></button></div>
  </article>;
}
function ApplyModal({ job, close, toast }: { job: Job; close: () => void; toast: (message: string) => void }) {
  const [form, setForm] = useState({ name: '', email: '', message: '', resumeUrl: '', consent: false, website: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ id: string; token: string } | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setError('');
    try {
      const response = await api.apply(job.id, form);
      if (response.withdrawal) setReceipt(response.withdrawal);
      else { toast('Votre candidature a été enregistrée.'); close(); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur inconnue.'); }
    finally { setPending(false); }
  }
  return <Modal onClose={close} title="Postuler à cette offre">
    {receipt ? <div className="success-block"><CheckCircle2 size={48} /><h2>Candidature enregistrée</h2><p>Votre candidature est disponible dans le tableau de bord de l’employeur. Conservez ce lien privé si vous souhaitez la retirer ultérieurement.</p><label>Lien de retrait personnel</label><input readOnly onFocus={e => e.target.select()} value={`${window.location.origin}/?retrait=${encodeURIComponent(receipt.id)}.${encodeURIComponent(receipt.token)}`} /><ActionButton onClick={close}>Terminer <Check size={17} /></ActionButton></div> : <>
      <div className="form-note"><strong>{job.title}</strong><span>{job.company} · {job.location}</span></div>
      <form className="form-stack" onSubmit={submit}>
        <label>Nom complet <input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Votre nom" /></label>
        <label>Adresse courriel <input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="nom@exemple.ca" /></label>
        <label>Lien vers votre CV <span className="optional">(facultatif)</span><input type="url" maxLength={400} placeholder="https://..." value={form.resumeUrl} onChange={e => setForm({ ...form, resumeUrl: e.target.value })} /><small>Un lien partagé et accessible par l’employeur, plutôt qu’un téléversement de fichier.</small></label>
        <label>Message de présentation <textarea required minLength={30} maxLength={3000} rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Présentez votre expérience et expliquez votre intérêt pour ce poste…" /></label>
        <label className="visually-hidden">Site web <input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></label>
        <label className="check-label"><input required type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} /><span>J’accepte que mes coordonnées et mon message soient transmis à l’employeur pour cette candidature. <a href="#confidentialite" onClick={close}>Confidentialité</a></span></label>
        {error && <p className="error" role="alert">{error}</p>}
        <ActionButton type="submit" disabled={pending}>{pending ? 'Envoi en cours…' : 'Envoyer ma candidature'} <Send size={17} /></ActionButton>
      </form>
    </>}
  </Modal>;
}
function JobDetail({ job, close, apply }: { job: Job; close: () => void; apply: () => void }) {
  return <Modal title="Détails de l’offre" onClose={close}>
    <div className="job-detail-head"><div className="company-icon large">{job.company.slice(0, 1).toLocaleUpperCase('fr-CA')}</div><Pill>{job.category}</Pill></div>
    <h2 className="detail-title">{job.title}</h2><p className="detail-company">{job.company}</p>
    <div className="detail-facts"><span><MapPin size={16} />{job.location}</span><span><Clock3 size={16} />{job.type}</span><span><Globe2 size={16} />{job.mode}</span></div>
    <div className="detail-pay">{job.salaryMin == null ? 'Salaire à discuter' : `${money(job.salaryMin)}${job.salaryMax != null ? ` – ${money(job.salaryMax)}` : ' et +'}`} <small>CAD · rémunération indiquée par l’employeur</small></div>
    <h3>À propos du poste</h3><p className="job-description">{job.description}</p>
    {job.tags.length > 0 && <div className="job-tags">{job.tags.map(tag => <Pill key={tag}>{tag}</Pill>)}</div>}
    <div className="detail-action"><ActionButton onClick={apply}>Postuler maintenant <ArrowRight size={18} /></ActionButton><span>Publiée le {when(job.publishedAt)}</span></div>
  </Modal>;
}
function AuthPanel({ onLogin, toast }: { onLogin: (account: Account) => void; toast: (message: string) => void }) {
  const [register, setRegister] = useState(false);
  const [credentials, setCredentials] = useState({ name: '', company: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setPending(true);
    try {
      if (register) {
        const response = await api.register(credentials);
        toast(response.message + ' Connectez-vous pour préparer vos offres.'); setRegister(false); setCredentials({ ...credentials, password: '' });
      } else { const response = await api.login(credentials.email, credentials.password); onLogin(response.user); toast('Connexion réussie.'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur de connexion.'); }
    finally { setPending(false); }
  }
  return <div className="auth-layout"><div className="auth-story"><div className="eyebrow light">POUR LES ENTREPRISES</div><h2>Les bons talents.<br /><em>Sans détour.</em></h2><p>Créez vos offres, gérez vos candidatures et gardez le contrôle sur votre recrutement dans un espace unique.</p><div className="auth-points"><span><CheckCircle2 size={18} /> Un tableau de bord dédié</span><span><CheckCircle2 size={18} /> Des candidatures regroupées</span><span><CheckCircle2 size={18} /> Des offres publiées après vérification</span></div></div>
    <div className="auth-form-card"><span className="mini-label">ESPACE EMPLOYEUR</span><h2>{register ? 'Créer mon compte' : 'Heureux de vous revoir.'}</h2><p>{register ? 'Votre entreprise doit être vérifiée avant de publier.' : 'Connectez-vous pour gérer vos offres.'}</p>
      <form className="form-stack" onSubmit={submit}>
        {register && <><label>Votre nom<input required minLength={2} maxLength={100} autoComplete="name" value={credentials.name} onChange={e => setCredentials({ ...credentials, name: e.target.value })} placeholder="Nom et prénom" /></label><label>Entreprise<input required minLength={2} maxLength={130} autoComplete="organization" value={credentials.company} onChange={e => setCredentials({ ...credentials, company: e.target.value })} placeholder="Nom de votre organisation" /></label></>}
        <label>Courriel professionnel<input required type="email" autoComplete="email" value={credentials.email} onChange={e => setCredentials({ ...credentials, email: e.target.value })} placeholder="vous@entreprise.ca" /></label>
        <label>Mot de passe<input required type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 12 : undefined} maxLength={128} value={credentials.password} onChange={e => setCredentials({ ...credentials, password: e.target.value })} placeholder={register ? '12 caractères minimum' : 'Votre mot de passe'} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <ActionButton type="submit" disabled={pending}>{pending ? 'Traitement…' : register ? 'Créer mon compte' : 'Se connecter'} <ArrowRight size={17} /></ActionButton>
      </form>
      <button className="switch-auth" type="button" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Déjà inscrit ? Se connecter' : 'Pas de compte ? Inscrire mon entreprise'} <ArrowRight size={15} /></button>
      <p className="login-notice"><ShieldCheck size={16} /> Accès réservé à votre organisation. Vos candidatures ne sont pas visibles par les autres entreprises.</p>
    </div>
  </div>;
}
function EmployerDashboard({ account, onLogout, toast }: { account: Account; onLogout: () => void; toast: (message: string) => void }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState<'jobs' | 'applications'>('jobs');
  const [editor, setEditor] = useState(false);
  const [form, setForm] = useState<FormJob>(initialForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function refresh() {
    try { const [j, a] = await Promise.all([api.employerJobs(), api.employerApplications()]); setJobs(j.jobs); setApplications(a.applications); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur de chargement.'); }
  }
  useEffect(() => { void refresh(); }, []);
  function edit(job?: Job) {
    setEditing(job?.id || null);
    setForm(job ? { title: job.title, location: job.location, category: job.category, type: job.type, mode: job.mode, description: job.description, salaryMin: job.salaryMin, salaryMax: job.salaryMax, tags: job.tags } : { ...initialForm });
    setError(''); setEditor(true);
  }
  async function save(e: FormEvent) {
    e.preventDefault(); setPending(true); setError('');
    try { if (editing) await api.updateJob(editing, form); else await api.createJob(form); await refresh(); setEditor(false); toast('Offre enregistrée en brouillon.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.'); }
    finally { setPending(false); }
  }
  async function toggle(job: Job) {
    try { await api.setPublished(job.id, job.status !== 'published'); await refresh(); toast(job.status === 'published' ? 'Offre retirée.' : 'Offre publiée.'); }
    catch (err) { toast(err instanceof Error ? err.message : 'Action impossible.'); }
  }
  const jobTitles = useMemo(() => new Map(jobs.map(job => [job.id, job.title])), [jobs]);
  return <div className="dashboard page-width"><div className="dashboard-head"><div><div className="eyebrow">TABLEAU DE BORD ENTREPRISE</div><h1>Bonjour, {account.name.split(' ')[0]} <span className="wave">✳</span></h1><p>{account.company} · Gérez vos recrutements au même endroit.</p></div><button className="btn btn-line" type="button" onClick={onLogout}><LogOut size={17} /> Déconnexion</button></div>
    {!account.approved && <div className="review-alert"><ShieldCheck size={22} /><div><strong>Vérification de votre entreprise en cours</strong><p>Vous pouvez préparer vos offres dès maintenant. La publication sera disponible après approbation par l’administrateur.</p></div></div>}
    <div className="stats-grid"><div><span>Offres créées</span><strong>{jobs.length}</strong><BriefcaseBusiness size={24} /></div><div><span>Offres en ligne</span><strong>{jobs.filter(j => j.status === 'published').length}</strong><Globe2 size={24} /></div><div><span>Candidatures reçues</span><strong>{applications.length}</strong><Users size={24} /></div></div>
    <div className="dashboard-toolbar"><div className="tab-bar"><button className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')} type="button">Mes offres</button><button className={tab === 'applications' ? 'active' : ''} onClick={() => setTab('applications')} type="button">Candidatures <span>{applications.length}</span></button></div><ActionButton onClick={() => edit()}>Créer une offre <ArrowRight size={17} /></ActionButton></div>
    {error && !editor && <p className="error" role="alert">{error}</p>}
    {tab === 'jobs' ? jobs.length === 0 ? <Empty title="Votre prochaine embauche commence ici" text="Créez votre première offre. Elle restera un brouillon jusqu’à sa publication."><ActionButton onClick={() => edit()}>Créer ma première offre <ArrowRight size={16} /></ActionButton></Empty> : <div className="dashboard-list">{jobs.map(job => <div className="dashboard-item" key={job.id}><div className="company-icon">{job.company.slice(0, 1)}</div><div className="dashboard-item-text"><h3>{job.title}</h3><p>{job.location} · {job.type} · {when(job.createdAt)}</p></div><span className={job.status === 'published' ? 'status live' : 'status'}>{job.status === 'published' ? 'En ligne' : 'Brouillon'}</span><button className="text-link" onClick={() => edit(job)} type="button">Modifier</button><button className="btn btn-small" disabled={!account.approved && job.status === 'draft'} onClick={() => toggle(job)} type="button">{job.status === 'published' ? 'Retirer' : 'Publier'}</button></div>)}</div> : applications.length === 0 ? <Empty title="Pas encore de candidatures" text="Les candidatures reçues pour vos offres publiées apparaîtront ici." /> : <div className="dashboard-list">{applications.map(a => <article className="application-row" key={a.id}><div className="application-symbol"><Mail size={20} /></div><div><h3>{a.name}</h3><p>{jobTitles.get(a.jobId) || 'Offre archivée'} · {when(a.createdAt)}</p><a href={`mailto:${encodeURIComponent(a.email)}`}>{a.email}</a><p className="application-message">{a.message}</p>{a.resumeUrl && <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer">Consulter le CV <ArrowUpRight size={13} /></a>}</div></article>)}</div>}
    {editor && <Modal title={editing ? 'Modifier l’offre' : 'Nouvelle offre d’emploi'} onClose={() => setEditor(false)}><form className="form-stack" onSubmit={save}>
      <label>Intitulé du poste<input required minLength={5} maxLength={120} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex. Coordonnateur marketing" /></label>
      <label>Ville ou région<input required minLength={2} maxLength={100} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex. Montréal, QC" /></label>
      <div className="form-two"><label>Secteur<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>Type de contrat<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{types.slice(1).map(t => <option key={t}>{t}</option>)}</select></label></div>
      <label>Mode de travail<select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>{modes.slice(1).map(m => <option key={m}>{m}</option>)}</select></label>
      <div className="form-two"><label>Salaire minimum (CAD)<input min={0} max={10000000} type="number" value={form.salaryMin ?? ''} onChange={e => setForm({ ...form, salaryMin: e.target.value === '' ? null : Number(e.target.value) })} /></label><label>Salaire maximum (CAD)<input min={0} max={10000000} type="number" value={form.salaryMax ?? ''} onChange={e => setForm({ ...form, salaryMax: e.target.value === '' ? null : Number(e.target.value) })} /></label></div>
      <label>Description détaillée<textarea required minLength={50} maxLength={6000} rows={8} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Responsabilités, qualifications, avantages, horaires…" /></label>
      <label>Compétences (séparées par des virgules)<input value={form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).slice(0, 6) })} placeholder="Gestion, Excel, Communication" /></label>
      {editing && <p className="review-alert compact"><ShieldCheck size={18} /> Une modification remet l’offre à l’état brouillon jusqu’à sa republication.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <ActionButton type="submit" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer le brouillon'} <Check size={17} /></ActionButton>
    </form></Modal>}
  </div>;
}
function Privacy({ back }: { back: () => void }) {
  return <main className="policy page-width"><button className="text-link" onClick={back} type="button"><ArrowLeft size={16} /> Retour aux offres</button><div className="eyebrow">PROTECTION DES RENSEIGNEMENTS</div><h1>Confidentialité</h1><p>EMPLOIDIRECT.CA traite les renseignements fournis volontairement lors de la création d’un compte employeur et lors de l’envoi d’une candidature.</p><h2>Ce que nous recueillons</h2><p>Pour les employeurs : nom, société, adresse courriel et empreinte cryptographique du mot de passe. Pour les candidatures : nom, courriel, message de présentation et, s’il est fourni, lien vers le CV. Les données de session servent à sécuriser l’accès aux comptes.</p><h2>Pourquoi</h2><p>Les informations d’une candidature sont accessibles uniquement au compte de l’employeur ayant publié l’offre concernée. Nous ne vendons pas ces données et n’utilisons pas les candidatures pour le ciblage publicitaire.</p><h2>Conservation et retrait</h2><p>Les candidatures sont conservées au maximum 180 jours. Après l’envoi, un lien personnel permet de retirer une candidature sans créer de compte. Conservez ce lien en lieu sûr. Les offres et comptes employeurs restent actifs tant que l’administrateur ne les supprime pas.</p><h2>Sécurité et limites</h2><p>Les mots de passe sont hachés, les sessions sont protégées par des témoins HTTP-only et l’accès aux candidatures est limité à leur employeur. Évitez d’inscrire des renseignements sensibles non nécessaires dans votre message. Les CV hébergés chez un tiers sont soumis aux conditions de cet hébergeur.</p><h2>Avant le lancement commercial</h2><p>Les coordonnées officielles du responsable de la protection des renseignements personnels et les modalités de gestion des demandes d’accès/correction doivent être publiées et validées par l’exploitant.</p></main>;
}
function Withdraw({ value, back }: { value: string; back: () => void }) {
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState('');
  async function withdraw() {
    const separator = value.indexOf('.');
    if (separator < 0) return setResult('Lien invalide.');
    const id = value.slice(0, separator), secret = value.slice(separator + 1);
    setWorking(true);
    try { await api.withdraw(id, secret); setResult('Votre candidature a été retirée de la plateforme.'); }
    catch (err) { setResult(err instanceof Error ? err.message : 'Retrait impossible.'); }
    finally { setWorking(false); }
  }
  return <main className="withdraw page-width"><div className="form-note"><LockKeyhole size={26} /><h1>Retirer ma candidature</h1><p>Cette action supprime les renseignements de la candidature stockés sur EMPLOIDIRECT.CA. Elle ne peut pas annuler toute copie déjà consultée ou conservée par l’employeur.</p>{result ? <p role="status">{result}</p> : <ActionButton disabled={working} onClick={withdraw}>{working ? 'Retrait en cours…' : 'Confirmer le retrait'} <ArrowRight size={17} /></ActionButton>}<button type="button" className="text-link" onClick={back}>Retour aux offres</button></div></main>;
}
export default function App() {
  const [view, setView] = useState<'jobs' | 'employer' | 'privacy' | 'withdraw'>(() => location.hash === '#confidentialite' ? 'privacy' : new URLSearchParams(location.search).has('retrait') ? 'withdraw' : 'jobs');
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [searched, setSearched] = useState({ q: '', location: '' });
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('ed-saved') || '[]'); } catch { return []; } });
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [detail, setDetail] = useState<Job | null>(null);
  const [apply, setApply] = useState<Job | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [toast, setToast] = useState('');
  const [connected, setConnected] = useState(true);
  useEffect(() => { api.me().then(({ user }) => setAccount(user)).catch(() => setConnected(false)); }, []);
  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (searched.q) params.set('q', searched.q);
    if (searched.location) params.set('location', searched.location);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    if (mode) params.set('mode', mode);
    let active = true;
    setLoading(true); setLoadError('');
    api.jobs(params).then(response => { if (active) { setJobs(response.jobs); setTotal(response.total); setConnected(true); } }).catch(e => { if (active) { setLoadError(e instanceof Error ? e.message : 'Erreur de chargement.'); setConnected(false); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [searched, category, type, mode, page]);
  useEffect(() => { localStorage.setItem('ed-saved', JSON.stringify(saved)); }, [saved]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(''), 5500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const matchingJobs = favoritesOnly ? jobs.filter(job => saved.includes(job.id)) : jobs;
  const filtersSet = Boolean(category || type || mode || searched.q || searched.location || favoritesOnly);
  function navigate(to: typeof view) { setView(to); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function search(e: FormEvent) { e.preventDefault(); setPage(1); setSearched({ q: query.trim(), location: locationInput.trim() }); document.querySelector('#offres')?.scrollIntoView({ behavior: 'smooth' }); }
  function reset() { setQuery(''); setLocationInput(''); setSearched({ q: '', location: '' }); setCategory(''); setMode(''); setType(''); setFavoritesOnly(false); setPage(1); }
  function toggleSave(id: string) { setSaved(old => old.includes(id) ? old.filter(item => item !== id) : [...old, id]); }
  async function logout() { try { await api.logout(); setAccount(null); setToast('Vous êtes déconnecté.'); } catch { setToast('Déconnexion impossible.'); } }
  return <div className="app-shell">{PREVIEW_ONLY && <div className="preview-banner"><ShieldCheck size={16}/> Prévisualisation technique — aucune candidature ni inscription acceptée. <a href="https://github.com/takatakca/EMPLOIDIRECT.CA" target="_blank" rel="noopener noreferrer">Code source <ArrowUpRight size={14}/></a></div>}<header className="site-header"><div className="page-width header-inner"><button className="logo-button" onClick={() => navigate('jobs')} type="button" aria-label="EMPLOIDIRECT.CA — accueil"><IconBrand /></button><nav aria-label="Navigation principale" className={menu ? 'open' : ''}><button type="button" className={view === 'jobs' ? 'nav-active' : ''} onClick={() => navigate('jobs')}>Trouver un emploi</button><button type="button" onClick={() => { navigate('jobs'); document.querySelector('#secteurs')?.scrollIntoView({ behavior: 'smooth' }); }}>Explorer les secteurs</button><button type="button" className={view === 'employer' ? 'nav-active' : ''} onClick={() => navigate('employer')}>Pour les employeurs</button></nav><div className="header-actions"><button className="favorites-trigger" aria-label="Voir les favoris" type="button" onClick={() => { navigate('jobs'); setFavoritesOnly(true); document.querySelector('#offres')?.scrollIntoView({ behavior: 'smooth' }); }}><Bookmark size={19} /> <span>{saved.length}</span></button><button className="header-employer" type="button" onClick={() => navigate('employer')}>{account ? 'Mon espace' : 'Espace employeur'} <ArrowUpRight size={16} /></button></div><button type="button" className="mobile-menu" aria-label="Ouvrir le menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={23} /> : <Menu size={23} />}</button></div></header>
    {view === 'employer' ? PREVIEW_ONLY ? <main className="preview-portal page-width"><ShieldCheck size={44}/><div className="eyebrow">MODE APERÇU</div><h1>Votre espace employeur arrive.</h1><p>Cette prévisualisation permet de découvrir la plateforme. Les comptes, publications et candidatures seront activés uniquement sur un hébergement de production avec stockage persistant et configuration de sécurité validée.</p><ActionButton variant="secondary" onClick={() => navigate('jobs')}>Explorer la plateforme <ArrowRight size={18}/></ActionButton></main> : account ? <EmployerDashboard account={account} onLogout={logout} toast={setToast} /> : <main className="page-width employer-view"><AuthPanel onLogin={setAccount} toast={setToast} /></main> : view === 'privacy' ? <Privacy back={() => navigate('jobs')} /> : view === 'withdraw' ? <Withdraw value={new URLSearchParams(location.search).get('retrait') || ''} back={() => { history.replaceState({}, '', '/'); navigate('jobs'); }} /> : <main>
      <section className="hero"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="page-width hero-inner"><div className="hero-left"><div className="hero-kicker"><span className="kicker-light" /> LE BON EMPLOI, AU BON MOMENT</div><h1>Votre prochaine<br />opportunité <span>commence ici<span className="title-period">.</span></span></h1><p>Une recherche simple. Des contacts directs. Des possibilités à votre mesure, partout au Québec et au Canada.</p><form className="hero-search" onSubmit={search}><label className="search-keyword"><Search size={22} /><span><small>QUEL POSTE ?</small><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Titre, compétence, entreprise..." /></span></label><div className="field-separator"/><label className="search-location"><MapPin size={21} /><span><small>OÙ ?</small><input value={locationInput} onChange={e => setLocationInput(e.target.value)} placeholder="Ville, province..." /></span></label><button className="search-submit" type="submit">Rechercher <ArrowRight size={18} /></button></form><div className="hero-extras"><span><CheckCircle2 size={16} /> Candidature directe</span><span><CheckCircle2 size={16} /> Recherche sans frais</span><span><CheckCircle2 size={16} /> Offres vérifiées</span></div></div><div className="hero-art" aria-hidden="true"><div className="hero-float float-top"><span className="floating-icon"><Sparkles size={22}/></span><span><strong>De nouvelles portes</strong><small>Pour votre carrière</small></span></div><div className="hero-main-art"><div className="art-grid"/><div className="art-circle outer"/><div className="art-circle middle"/><div className="art-circle inner"/><div className="art-center"><BriefcaseBusiness size={94} strokeWidth={1.2}/></div><span className="art-star star-one">✦</span><span className="art-star star-two">✳</span><span className="art-line"/></div><div className="hero-float float-bottom"><span className="floating-icon blue"><ShieldCheck size={22}/></span><span><strong>Un lien direct</strong><small>Entre talents et entreprises</small></span></div></div></div></section>
      <section className="quick-strip"><div className="page-width quick-inner"><span><Sparkles size={19}/> UNE PLATEFORME PLUS SIMPLE</span><span className="quick-divider"/><p>Moins d’étapes. Plus de possibilités.</p><button type="button" onClick={() => document.querySelector('#offres')?.scrollIntoView({ behavior: 'smooth' })}>Parcourir les offres <ArrowDown size={16} /></button></div></section>
      <section id="secteurs" className="sectors-section page-width"><div className="section-header"><div><div className="eyebrow">VOTRE AVENIR, VOTRE DOMAINE</div><h2>Explorez selon <em>vos ambitions.</em></h2></div><p>Des possibilités dans les secteurs qui façonnent notre économie.</p></div><div className="sector-grid">{categoryCards.map(({ name, note, icon: Icon }, index) => <button className={`sector-card sector-${index}`} type="button" key={name} onClick={() => { setCategory(name); setPage(1); document.querySelector('#offres')?.scrollIntoView({ behavior: 'smooth' }); }}><div className="sector-icon"><Icon size={29} strokeWidth={1.6}/></div><div><strong>{name}</strong><span>{note}</span></div><ArrowUpRight size={19}/></button>)}</div></section>
      <section className="jobs-section" id="offres"><div className="page-width"><div className="section-header listing-header"><div><div className="eyebrow">LES OPPORTUNITÉS</div><h2>Un poste pour <em>vous.</em></h2></div><p>Explorez les postes publiés directement par des employeurs.</p></div><div className="list-layout"><aside className="filter-pane"><div className="filter-heading"><strong><SlidersHorizontal size={19}/> Affiner la recherche</strong>{filtersSet && <button type="button" onClick={reset}>Effacer</button>}</div><label>Secteur d’activité<div className="select-wrap"><select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>{categories.map((c, i) => <option key={c} value={i === 0 ? '' : c}>{c}</option>)}</select><ChevronDown size={17}/></div></label><label>Type de contrat<div className="select-wrap"><select value={type} onChange={e => { setType(e.target.value); setPage(1); }}>{types.map((t, i) => <option key={t} value={i === 0 ? '' : t}>{t}</option>)}</select><ChevronDown size={17}/></div></label><label>Mode de travail<div className="select-wrap"><select value={mode} onChange={e => { setMode(e.target.value); setPage(1); }}>{modes.map((m, i) => <option key={m} value={i === 0 ? '' : m}>{m}</option>)}</select><ChevronDown size={17}/></div></label><button className={`saved-filter ${favoritesOnly ? 'active' : ''}`} type="button" onClick={() => setFavoritesOnly(!favoritesOnly)}><Bookmark size={18} /> Offres sauvegardées <span>{saved.length}</span></button><div className="aside-callout"><div><Sparkles size={23}/></div><strong>Votre prochain chapitre commence ici.</strong><p>Trouvez le poste qui vous ressemble et contactez l’employeur.</p><button type="button" onClick={reset}>Voir toutes les offres <ArrowRight size={15}/></button></div></aside><div className="results-pane"><div className="results-toolbar"><div><Filter size={18}/><strong>{loading ? 'Recherche en cours…' : `${favoritesOnly ? matchingJobs.length : total} offre${(favoritesOnly ? matchingJobs.length : total) !== 1 ? 's' : ''}`}</strong> <span>correspondant à votre recherche</span></div><span className="results-sort">Les plus récentes en premier</span></div>{loadError && <div className="error-panel" role="alert"><strong>Impossible de charger les offres.</strong><p>{loadError}</p><button type="button" onClick={() => setSearched({ ...searched })}>Réessayer</button></div>}{!loadError && (loading ? <div className="loading-list"><div/><div/><div/></div> : matchingJobs.length === 0 ? <Empty title={favoritesOnly ? 'Aucune offre sauvegardée dans ces résultats' : total === 0 && !filtersSet ? 'Les premières offres arrivent bientôt' : 'Aucune offre ne correspond à ces critères'} text={favoritesOnly ? 'Sauvegardez des offres avec l’icône de marque-page, puis retrouvez-les ici.' : total === 0 && !filtersSet ? 'Les entreprises préparent leurs annonces. Revenez consulter les nouvelles opportunités prochainement.' : 'Essayez une autre ville, un autre secteur ou des critères moins précis.'}>{filtersSet && <ActionButton variant="secondary" onClick={reset}>Réinitialiser les filtres <ArrowRight size={16}/></ActionButton>}</Empty> : <><div className="job-grid">{matchingJobs.map(job => <JobCard key={job.id} job={job} saved={saved.includes(job.id)} toggleSave={() => toggleSave(job.id)} open={() => setDetail(job)} />)}</div>{!favoritesOnly && total > 12 && <div className="pagination"><button type="button" disabled={page <= 1} onClick={() => { setPage(page - 1); document.querySelector('#offres')?.scrollIntoView(); }}>Précédent</button><span>Page {page} de {Math.ceil(total / 12)}</span><button type="button" disabled={page >= Math.ceil(total / 12)} onClick={() => { setPage(page + 1); document.querySelector('#offres')?.scrollIntoView(); }}>Suivant</button></div>}</>)}</div></div></div></section>
      <section className="employer-cta"><div className="page-width cta-inner"><div className="cta-decoration" aria-hidden="true">✳</div><div><div className="eyebrow light">VOUS RECRUTEZ ?</div><h2>Les meilleurs talents<br />n’attendent <em>pas.</em></h2><p>Diffusez vos offres et recevez les candidatures dans votre propre espace, sans intermédiaire inutile.</p></div><button className="cta-button" type="button" onClick={() => navigate('employer')}>Je recrute des talents <ArrowUpRight size={19}/></button></div></section>
    </main>}
    <footer className="site-footer"><div className="page-width footer-main"><div className="footer-about"><IconBrand /><p>L’emploi, sans détour.<br />Une connexion plus directe entre les talents et les entreprises.</p></div><div className="footer-links"><strong>Explorer</strong><button type="button" onClick={() => navigate('jobs')}>Offres d’emploi</button><button type="button" onClick={() => navigate('employer')}>Espace employeur</button></div><div className="footer-links"><strong>Informations</strong><button type="button" onClick={() => navigate('privacy')}>Confidentialité</button><a href="https://takatak.ca" target="_blank" rel="noopener noreferrer">GROUPE TAKATAK <ArrowUpRight size={13}/></a></div><div className="footer-badge"><ShieldCheck size={21}/><div><strong>Des échanges directs</strong><p>Vos données restent propres à chaque entreprise.</p></div></div></div><div className="page-width footer-bottom"><span>© {new Date().getFullYear()} EMPLOIDIRECT.CA. Tous droits réservés.</span><span>Une initiative de GROUPE TAKATAK.</span></div></footer>
    {detail && <JobDetail job={detail} close={() => setDetail(null)} apply={() => { setApply(detail); setDetail(null); }} />}
    {apply && <ApplyModal job={apply} close={() => setApply(null)} toast={setToast} />}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18}/>{toast}<button type="button" aria-label="Fermer la notification" onClick={() => setToast('')}><X size={15}/></button></div>}
    {!connected && <div className="offline-notice" role="status">Le serveur n’est pas disponible. Les inscriptions et candidatures sont temporairement désactivées.</div>}
  </div>;
}
