import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { request } from './Auth';

type Chapter = { key: string; title: string; subject: string; grade: string; progress: number; subtopics: string[]; subtopicsDone?: boolean[] };

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const localDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function SyllabusCalendar() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const start = useMemo(() => localDay(new Date()), []);
  const [selected, setSelected] = useState(start);
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));

  useEffect(() => {
    request('/syllabus')
      .then(({ chapters }) => setChapters(chapters))
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load the syllabus.'))
      .finally(() => setLoading(false));
  }, []);

  const doneOf = (chapter: Chapter): boolean[] => chapter.subtopicsDone ?? chapter.subtopics.map(() => false);

  // Only chapters that still have work left are queued onto the calendar.
  const pending = useMemo(() => chapters.filter(c => c.progress < 100), [chapters]);

  const index = Math.max(0, Math.floor((localDay(selected).getTime() - start.getTime()) / 86400000));
  const dayChapter = pending.length ? pending[index % pending.length] : null;

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = first.getDay();
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));

  const chapterForDate = (date: Date) => {
    if (!pending.length) return null;
    const i = Math.max(0, Math.floor((localDay(date).getTime() - start.getTime()) / 86400000));
    return pending[i % pending.length];
  };

  const toggleSubtopic = async (chapter: Chapter, i: number) => {
    const current = doneOf(chapter);
    const nextDone = !current[i];
    setChapters(items => items.map(item => item.key === chapter.key ? { ...item, subtopicsDone: doneOf(item).map((d, n) => n === i ? nextDone : d) } : item));
    try {
      const result = await request(`/syllabus/${encodeURIComponent(chapter.key)}/subtopics/${i}`, { method: 'PATCH', body: JSON.stringify({ done: nextDone }) });
      setChapters(items => items.map(item => item.key === chapter.key
        ? { ...item, subtopicsDone: doneOf(item).map((d, n) => n === i ? result.done : d), progress: result.progress }
        : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that change.');
      setChapters(items => items.map(item => item.key === chapter.key ? { ...item, subtopicsDone: doneOf(item).map((d, n) => n === i ? !nextDone : d) } : item));
    }
  };

  return <section className="calendar-page" id="syllabus-calendar">
    <div className="planner-heading">
      <div>
        <p className="eyebrow">LIVE SYLLABUS CALENDAR</p>
        <h1>Your syllabus, mapped onto the calendar</h1>
        <p>Each day pulls the next unfinished chapter straight from your live syllabus tracker — no hardcoded plan, just what's actually left to cover.</p>
      </div>
      <div className="planner-phase">
        <Target />
        <div><small>CHAPTERS REMAINING</small><b>{pending.length}</b><span>of {chapters.length || 0} total</span></div>
      </div>
    </div>

    {error && <p className="syllabus-empty" style={{ color: '#ff8f8f' }}>{error} — make sure the backend (backend/app.py) is running, then reload.</p>}
    {loading ? <p className="syllabus-empty">Loading your syllabus…</p> : <div className="planner-layout">
      <aside className="calendar-card">
        <div className="calendar-title">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button>
          <b>{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</b>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button>
        </div>
        <div className="calendar-weekdays">{weekdays.map(d => <span key={d}>{d}</span>)}</div>
        <div className="calendar-days">{days.map(day => {
          const inMonth = day.getMonth() === month.getMonth();
          const selectedDay = key(day) === key(selected);
          const active = day >= start;
          const chapter = chapterForDate(day);
          return <button key={key(day)} disabled={!active} className={`${!inMonth ? 'outside' : ''} ${selectedDay ? 'chosen' : ''} ${active ? 'planned' : ''}`} onClick={() => setSelected(day)} title={chapter ? chapter.title : ''}>{day.getDate()}</button>;
        })}</div>
        <p className="calendar-note"><i /> Each date maps to the next incomplete chapter in your syllabus</p>
      </aside>
      <div className="day-plan">
        <div className="day-plan-title">
          <div>
            <p className="eyebrow">{selected.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h2>{dayChapter ? dayChapter.title : pending.length ? 'No chapter scheduled' : 'Syllabus complete 🎉'}</h2>
          </div>
          <button onClick={() => { setSelected(start); setMonth(new Date(start.getFullYear(), start.getMonth(), 1)); }}>Today</button>
        </div>
        {dayChapter ? <div className="plan-blocks">
          <article className="plan-block prep">
            <CalendarDays size={16} />
            <div><span>{dayChapter.subject} · {dayChapter.grade}</span><h3>{dayChapter.title}</h3><p>{dayChapter.progress}% complete</p></div>
          </article>
          <ul className="subtopic-list">{dayChapter.subtopics.map((subtopic, i) => {
            const done = doneOf(dayChapter);
            return <li key={subtopic}><label className={done[i] ? 'subtopic-check checked' : 'subtopic-check'}>
              <input type="checkbox" checked={done[i]} onChange={() => toggleSubtopic(dayChapter, i)} />
              <span>{subtopic}</span>
            </label></li>;
          })}</ul>
        </div> : <p className="syllabus-empty">{pending.length ? 'Pick a date to see its assigned chapter.' : 'Every chapter in your syllabus is marked complete — nice work.'}</p>}
      </div>
    </div>}
  </section>;
}
