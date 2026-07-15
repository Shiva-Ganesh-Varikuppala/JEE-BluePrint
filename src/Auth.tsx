import { FormEvent, useState } from 'react';
export type Account = { id: number; name: string; email: string };
const API = import.meta.env.VITE_API_URL || "/api";
export async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("jee-token");
  const isForm = options.body instanceof FormData;

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();

  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned invalid response (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(body.error || body.msg || `HTTP ${response.status}`);
  }

  return body;
}
export default function Auth({ onSuccess }: { onSuccess: (account: Account) => void }) { const [mode, setMode] = useState<'login' | 'register'>('login'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); setLoading(true); try { const result = await request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name, email, password }) }); localStorage.setItem('jee-token', result.token); onSuccess(result.user); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to continue.'); } finally { setLoading(false); } }; return <div className="auth-page"><div className="auth-art"><span className="brand-mark">J</span><h1>Build your<br/><i>blueprint.</i></h1><p>Your personal command center for JEE preparation.</p></div><main className="auth-panel"><div className="auth-form"><p className="eyebrow">JEE BLUEPRINT</p><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="auth-sub">{mode === 'login' ? 'Pick up exactly where you left off.' : 'Start building your best study system today.'}</p><form onSubmit={submit}>{mode === 'register' && <label>Your name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Arjun Kumar" /></label>}<label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="auth-submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button></form><p className="auth-switch">{mode === 'login' ? 'New to JEE Blueprint?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create one' : 'Sign in'}</button></p></div></main></div>; }
