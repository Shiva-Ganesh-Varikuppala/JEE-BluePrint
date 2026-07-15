import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './dark.css';
import './syllabus.css';
import './tasks.css';
import './strategy.css';
import './planner.css';
import './mobile.css';
import './focus.css';
import './dashboard-cleanup.css';
import './page-routes.css';
import './ai.css';
import App from './App';
import Auth, { Account, request } from './Auth';
import Syllabus from './Syllabus';
import Tasks from './Tasks';
import Strategy from './Strategy';
import Planner from './Planner';
import FocusTools from './FocusTools';
import AiTutor from './AiTutor';
import PersonalTimetable from './PersonalTimetable';
import SyllabusCalendar from './SyllabusCalendar';

function Root() {
  const [account, setAccount] = useState<Account | null>(null);
  const [page, setPage] = useState<'dashboard' | 'focus' | 'syllabus' | 'ai' | 'personal' | 'planner' | 'mocktests' | 'calendar'>(() => {
    const hash = window.location.hash;
    if (hash === '#focus') return 'focus';
    if (hash === '#syllabus') return 'syllabus';
    if (hash === '#ai') return 'ai';
    if (hash === '#personal') return 'personal';
    if (hash === '#planner') return 'planner';
    if (hash === '#mocktests') return 'mocktests';
    if (hash === '#calendar') return 'calendar';
    return 'dashboard';
  });
  useEffect(() => { if (localStorage.getItem('jee-token')) request('/auth/me').then(({ user }) => setAccount(user)).catch(() => localStorage.removeItem('jee-token')); }, []);
  useEffect(() => { document.body.className = `route-${page}`; return () => { document.body.className = ''; }; }, [page]);
  useEffect(() => { const navigate = (event: MouseEvent) => { const link = (event.target as HTMLElement).closest('a'); const target = link?.textContent?.trim(); const next = target === 'Focus Tools' ? 'focus' : target === 'AI Study Assistant' ? 'ai' : target === 'Full Syllabus' ? 'syllabus' : target === 'Personal Time Table' ? 'personal' : target === 'Planner' ? 'planner' : target === 'Mock Tests' ? 'mocktests' : target === 'Syllabus Calendar' ? 'calendar' : target === 'Overview' ? 'dashboard' : undefined; if (next) { event.preventDefault(); window.location.hash = next === 'dashboard' ? '' : next; setPage(next); } }; document.addEventListener('click', navigate); return () => document.removeEventListener('click', navigate); }, []);
  const content = page === 'focus' ? <FocusTools /> : page === 'syllabus' ? <Syllabus /> : page === 'ai' ? <AiTutor /> : page === 'personal' ? <PersonalTimetable /> : page === 'planner' ? <Planner /> : page === 'mocktests' ? <Strategy /> : page === 'calendar' ? <SyllabusCalendar /> : <Tasks />;
  return account ? <><App account={account} onLogout={() => { localStorage.removeItem('jee-token'); setAccount(null); }} />{content}</> : <Auth onSuccess={setAccount} />;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
