import type { Account, Application, FormJob, Job } from './types';

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${url}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  } catch { throw new ApiError('Connexion au serveur impossible. Veuillez réessayer.', 0); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'Une erreur est survenue.', response.status);
  return data as T;
}
const post = <T>(url: string, body: object = {}) => request<T>(url, { method: 'POST', body: JSON.stringify(body) });
export const api = {
  jobs: (q: URLSearchParams) => request<{ jobs: Job[]; total: number; page: number; perPage: number }>(`/jobs?${q}`),
  me: () => request<{ user: Account | null }>('/auth/me'),
  login: (email: string, password: string) => post<{ user: Account }>('/auth/login', { email, password }),
  register: (data: { name: string; company: string; email: string; password: string }) => post<{ message: string }>('/auth/register', data),
  logout: () => post<{ ok: boolean }>('/auth/logout'),
  employerJobs: () => request<{ jobs: Job[] }>('/employer/jobs'),
  employerApplications: () => request<{ applications: Application[] }>('/employer/applications'),
  createJob: (job: FormJob) => post<{ job: Job }>('/employer/jobs', job),
  updateJob: (id: string, job: FormJob) => request<{ job: Job }>(`/employer/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) }),
  setPublished: (id: string, published: boolean) => post<{ job: Job }>(`/employer/jobs/${id}/${published ? 'publish' : 'unpublish'}`),
  apply: (id: string, form: object) => post<{ ok: boolean; withdrawal?: { id: string; token: string } }>(`/jobs/${id}/applications`, form),
  withdraw: (id: string, token: string) => post<{ ok: boolean }>('/applications/withdraw', { id, token }),
};
