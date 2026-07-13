import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { request } from './Auth';

type Chapter = { key: string; title: string; subject: string; grade: string; progress: number; subtopics: string[] };
const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];

export default function Syllabus() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subject, setSubject] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/syllabus').then(({ chapters }) => setChapters(chapters)).finally(() => setLoading(false));
  }, []);

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

  const update = async (chapter: Chapter, progress: number) => {
    const result = await request(`/syllabus/${encodeURIComponent(chapter.key)}`, { method: 'PATCH', body: JSON.stringify({ progress }) });
    setChapters(items => items.map(item => item.key === chapter.key ? { ...item, progress: result.progress } : item));
  };

  return <section className="syllabus" id="syllabus"><div className="syllabus-heading"><div><p className="eyebrow">YOUR JEE BLUEPRINT</p><h1>Detailed syllabus tracker</h1><p>All 92 chapters with chapter-wise subtopics for Mathematics, Physics, and Chemistry.</p></div><div className="syllabus-count"><b>{completed}<span> / {chapters.length || 92}</span></b><small>chapters complete · {subtopicCount || 557} subtopics</small></div></div><div className="syllabus-tools"><div className="subject-tabs">{subjects.map(item => <button key={item} className={subject === item ? 'selected' : ''} onClick={() => setSubject(item)}>{item}</button>)}</div><label className="chapter-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chapters or subtopics" /></label></div>{loading ? <p className="syllabus-empty">Loading your syllabus…</p> : <div className="syllabus-grid">{filtered.map(chapter => <article className="syllabus-card" key={chapter.key}><div className="chapter-title"><span className={'chapter-badge '+chapter.subject.toLowerCase()}>{chapter.subject[0]}</span><div><small>{chapter.subject} · {chapter.grade} · {chapter.subtopics.length} subtopics</small><h3>{chapter.title}</h3></div><button className={chapter.progress === 100 ? 'chapter-check complete' : 'chapter-check'} onClick={() => update(chapter, chapter.progress === 100 ? 0 : 100)} aria-label={`Mark ${chapter.title} ${chapter.progress === 100 ? 'incomplete' : 'complete'}`}>{chapter.progress === 100 && <Check size={14}/>}</button></div><ul className="subtopic-list">{chapter.subtopics.map(subtopic => <li key={subtopic}>{subtopic}</li>)}</ul><div className="chapter-meter"><i style={{ width: `${chapter.progress}%` }}/></div><div className="chapter-footer"><span>{chapter.progress === 100 ? 'Completed' : `${chapter.progress}% complete`}</span><button onClick={() => update(chapter, Math.min(100, chapter.progress + 25))}>+25%</button></div></article>)}</div>}{!loading && filtered.length === 0 && <p className="syllabus-empty">No chapters or subtopics match your search.</p>}</section>;
}
