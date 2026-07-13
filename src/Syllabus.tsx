import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { request } from './Auth';

type Subtopic = { title: string; completed: boolean };
type Chapter = { key: string; title: string; subject: string; grade: string; progress: number; subtopics: Subtopic[] };
const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];

export default function Syllabus() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
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
      const matchesSearch = !term || chapter.title.toLowerCase().includes(term) || chapter.subtopics.some(subtopic => subtopic.title.toLowerCase().includes(term));
      return matchesSubject && matchesSearch;
    });
  }, [chapters, subject, query]);
  const completed = chapters.filter(chapter => chapter.progress === 100).length;
  const subtopicCount = chapters.reduce((total, chapter) => total + chapter.subtopics.length, 0);
  const completedSubtopics = chapters.reduce((total, chapter) => total + chapter.subtopics.filter(subtopic => subtopic.completed).length, 0);

  const update = async (chapter: Chapter, progress: number) => {
    const result = await request(`/syllabus/${encodeURIComponent(chapter.key)}`, { method: 'PATCH', body: JSON.stringify({ progress }) });
    setChapters(items => items.map(item => item.key === chapter.key ? { ...item, progress: result.progress, subtopics: item.subtopics.map(subtopic => ({ ...subtopic, completed: result.progress === 100 })) } : item));
  };

  const toggleSubtopic = async (chapter: Chapter, subtopic: Subtopic) => {
    const result = await request(`/syllabus/${encodeURIComponent(chapter.key)}/subtopics`, { method: 'PATCH', body: JSON.stringify({ subtopic: subtopic.title, completed: !subtopic.completed }) });
    setChapters(items => items.map(item => item.key === chapter.key ? { ...item, progress: result.progress, subtopics: item.subtopics.map(topic => topic.title === subtopic.title ? result.subtopic : topic) } : item));
  };

  return <section className="syllabus" id="syllabus"><div className="syllabus-heading"><div><p className="eyebrow">YOUR JEE BLUEPRINT</p><h1>Detailed syllabus tracker</h1><p>Click any chapter to open its subtopic checklist and track preparation topic by topic.</p></div><div className="syllabus-count"><b>{completed}<span> / {chapters.length || 92}</span></b><small>{completedSubtopics} / {subtopicCount || 557} subtopics complete</small></div></div><div className="syllabus-tools"><div className="subject-tabs">{subjects.map(item => <button key={item} className={subject === item ? 'selected' : ''} onClick={() => setSubject(item)}>{item}</button>)}</div><label className="chapter-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chapters or subtopics" /></label></div>{loading ? <p className="syllabus-empty">Loading your syllabus…</p> : <div className="syllabus-grid">{filtered.map(chapter => { const isOpen = expanded === chapter.key; const done = chapter.subtopics.filter(subtopic => subtopic.completed).length; return <article className={isOpen ? 'syllabus-card open' : 'syllabus-card'} key={chapter.key}><button className="chapter-toggle" onClick={() => setExpanded(isOpen ? null : chapter.key)} aria-expanded={isOpen}><div className="chapter-title"><span className={'chapter-badge '+chapter.subject.toLowerCase()}>{chapter.subject[0]}</span><div><small>{chapter.subject} · {chapter.grade} · {done}/{chapter.subtopics.length} subtopics complete</small><h3>{chapter.title}</h3></div></div><ChevronDown className="chapter-arrow" size={17}/></button><div className="chapter-meter"><i style={{ width: `${chapter.progress}%` }}/></div><div className="chapter-footer"><span>{chapter.progress === 100 ? 'Completed' : `${chapter.progress}% complete`}</span><button onClick={() => update(chapter, chapter.progress === 100 ? 0 : 100)}>{chapter.progress === 100 ? 'Reset chapter' : 'Mark chapter done'}</button></div>{isOpen && <ul className="subtopic-list">{chapter.subtopics.map(subtopic => <li key={subtopic.title}><label className={subtopic.completed ? 'subtopic-check done' : 'subtopic-check'}><input type="checkbox" checked={subtopic.completed} onChange={() => toggleSubtopic(chapter, subtopic)} /><span>{subtopic.completed && <Check size={12}/>}</span><b>{subtopic.title}</b></label></li>)}</ul>}</article>; })}</div>}{!loading && filtered.length === 0 && <p className="syllabus-empty">No chapters or subtopics match your search.</p>}</section>;
}
