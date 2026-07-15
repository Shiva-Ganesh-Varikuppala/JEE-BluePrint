import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { request } from './Auth';

type Chapter = { key: string; title: string; subject: string; grade: string; progress: number; subtopics: string[]; subtopicsDone?: boolean[] };
const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];

export default function Syllabus() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subject, setSubject] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/syllabus')
      .then(({ chapters }) => setChapters(chapters))
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load the syllabus.'))
      .finally(() => setLoading(false));
  }, []);

  const doneOf = (chapter: Chapter): boolean[] => chapter.subtopicsDone ?? chapter.subtopics.map(() => false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return chapters.filter(chapter => {
      const matchesSubject = subject === 'All' || chapter.subject === subject;
      const matchesSearch = !term || chapter.title.toLowerCase().includes(term) || chapter.subtopics.some(subtopic => subtopic.toLowerCase().includes(term));
      return matchesSubject && matchesSearch;
    });
  }, [chapters, subject, query]);
  const completed = chapters.filter(chapter => chapter.progress === 100).length;
  const subtopicCount = chapters.reduce((total, chapter) => total + chapter.subtopics.length, 0);
  const subtopicsDoneCount = chapters.reduce((total, chapter) => total + doneOf(chapter).filter(Boolean).length, 0);

  const toggleSubtopic = async (chapter: Chapter, index: number) => {
    const current = doneOf(chapter);
    const nextDone = !current[index];
    setChapters(items => items.map(item => item.key === chapter.key
      ? { ...item, subtopicsDone: doneOf(item).map((d, i) => i === index ? nextDone : d) }
      : item));
    try {
      const result = await request(`/syllabus/${encodeURIComponent(chapter.key)}/subtopics/${index}`, { method: 'PATCH', body: JSON.stringify({ done: nextDone }) });
      setChapters(items => items.map(item => item.key === chapter.key
        ? { ...item, subtopicsDone: doneOf(item).map((d, i) => i === index ? result.done : d), progress: result.progress }
        : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that change — is the backend running?');
      setChapters(items => items.map(item => item.key === chapter.key
        ? { ...item, subtopicsDone: doneOf(item).map((d, i) => i === index ? !nextDone : d) }
        : item));
    }
  };

  return <section className="syllabus" id="syllabus"><div className="syllabus-heading"><div><p className="eyebrow">YOUR JEE BLUEPRINT</p><h1>Detailed syllabus tracker</h1><p>All 92 chapters — check off each subtopic as you master it for Mathematics, Physics, and Chemistry.</p></div><div className="syllabus-count"><b>{completed}<span> / {chapters.length || 92}</span></b><small>chapters complete · {subtopicsDoneCount} / {subtopicCount || 557} subtopics done</small></div></div><div className="syllabus-tools"><div className="subject-tabs">{subjects.map(item => <button key={item} className={subject === item ? 'selected' : ''} onClick={() => setSubject(item)}>{item}</button>)}</div><label className="chapter-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chapters or subtopics" /></label></div>{error && <p className="syllabus-empty" style={{ color: '#ff8f8f' }}>{error} — make sure the backend (backend/app.py) is running, then reload.</p>}{loading ? <p className="syllabus-empty">Loading your syllabus…</p> : <div className="syllabus-grid">{filtered.map(chapter => { const done = doneOf(chapter); return <article className="syllabus-card" key={chapter.key}><div className="chapter-title"><span className={'chapter-badge '+chapter.subject.toLowerCase()}>{chapter.subject[0]}</span><div><small>{chapter.subject} · {chapter.grade} · {done.filter(Boolean).length}/{chapter.subtopics.length} subtopics</small><h3>{chapter.title}</h3></div><span className={chapter.progress === 100 ? 'chapter-check complete' : 'chapter-check'} aria-label={chapter.progress === 100 ? 'Chapter complete' : 'Chapter in progress'}>{chapter.progress === 100 && <Check size={14}/>}</span></div><ul className="subtopic-list">{chapter.subtopics.map((subtopic, i) => <li key={subtopic}><label className={done[i] ? 'subtopic-check checked' : 'subtopic-check'}><input type="checkbox" checked={done[i]} onChange={() => toggleSubtopic(chapter, i)} /><span>{subtopic}</span></label></li>)}</ul><div className="chapter-meter"><i style={{ width: `${chapter.progress}%` }}/></div><div className="chapter-footer"><span>{chapter.progress === 100 ? 'Completed' : `${chapter.progress}% complete`}</span></div></article>; })}</div>}{!loading && !error && filtered.length === 0 && <p className="syllabus-empty">No chapters or subtopics match your search.</p>}</section>;
}
