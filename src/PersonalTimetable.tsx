import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, CircleCheck, Clock3, Target } from 'lucide-react';
import { request } from './Auth';

const START = new Date(2026, 6, 14);
const END = new Date(2026, 11, 31);
const P1_END = new Date(2026, 9, 14);
const P2_END = new Date(2026, 10, 30);
const P3_END = new Date(2026, 11, 20);

type ApiChapter = { key: string; title: string; subject: string; grade: string; progress: number; subtopics: string[] };
type SubjectQueues = { queue: string[]; partialLen: number; revisionPool: string[]; all: string[] };

// Fallback snapshot (used only if the live syllabus API can't be reached) — your reported status as of mid-July 2026.
const fallbackPhysics = {
  completed: ["Mathematical Tools", "Units & Measurements", "Motion in 1D", "Motion in 2D", "Work, Energy & Power", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Electric Charges & Fields"],
  partial: ["Newton's Laws of Motion", "Rotational Motion", "Kinetic Theory of Gases", "Thermal Properties of Matter", "Thermodynamics (11th)", "Oscillations", "Waves", "Electrostatic Potential & Capacitance"],
  notStarted: ["Centre of Mass & System of Particles", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics & Optical Instruments", "Wave Optics", "Dual Nature of Radiation & Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
};
const fallbackChem = {
  completed: ["Structure of Atom", "Some Basic Concepts of Chemistry", "Redox Reactions", "Chemical Bonding & Molecular Structure", "States of Matter", "Solutions", "Classification of Elements & Periodicity", "S-Block Elements", "IUPAC Nomenclature", "Isomerism", "GOC", "Hydrocarbons", "Purification & Analysis of Organic Cmpds"],
  partial: ["Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemical Kinetics", "Electrochemistry", "Equilibrium", "Thermodynamics (11th)"],
  notStarted: ["Coordination Compounds", "d & f Block Elements", "P-Block Elements (11th)", "P-Block Elements (12th)", "Salt Analysis", "The Solid State", "Hydrogen", "Chemistry in Everyday Life", "Environmental Chemistry"],
};
const fallbackMath = {
  completed: ["Basic Mathematics", "Determinants", "Matrices", "Relations & Functions", "Limits, Continuity & Differentiability", "Method of Differentiation", "Sets", "Straight Lines", "Trigonometric Equations & Functions", "Properties of Triangles, Heights & Distances"],
  partial: ["Quadratic Equations", "Complex Numbers", "Applications of Derivatives"],
  notStarted: ["Circles", "Parabola", "Ellipse", "Hyperbola", "Permutations & Combinations", "Binomial Theorem", "Sequence & Series", "Statistics", "Indefinite Integration", "Definite Integration", "Applications of Integrals", "Inverse Trigonometric Functions", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Probability", "Linear Programming"],
};

function bucket(chapters: ApiChapter[] | null, subject: string, fb: { completed: string[]; partial: string[]; notStarted: string[] }): SubjectQueues {
  const subj = chapters ? chapters.filter(c => c.subject === subject) : [];
  if (subj.length === 0) {
    return { queue: fb.partial.concat(fb.notStarted), partialLen: fb.partial.length, revisionPool: fb.completed, all: fb.completed.concat(fb.partial, fb.notStarted) };
  }
  const completed = subj.filter(c => c.progress === 100).map(c => c.title);
  const partial = subj.filter(c => c.progress > 0 && c.progress < 100).map(c => c.title);
  const notStarted = subj.filter(c => c.progress === 0).map(c => c.title);
  return {
    queue: partial.concat(notStarted),
    partialLen: partial.length,
    revisionPool: completed.length ? completed : fb.completed,
    all: completed.concat(partial, notStarted),
  };
}

const localDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

function countIndex(from: Date, to: Date, exclude: number[]): number {
  let count = -1; let d = new Date(from);
  while (d <= to) { if (!exclude.includes(d.getDay())) count++; d = addDays(d, 1); }
  return count;
}

function phaseOf(date: Date): 1 | 2 | 3 | 4 {
  if (date <= P1_END) return 1;
  if (date <= P2_END) return 2;
  if (date <= P3_END) return 3;
  return 4;
}

type Slot = { time: string; cls: 'phy' | 'chem' | 'math' | 'rev' | 'break'; title: string; detail: string };
const mk = (time: string, cls: Slot['cls'], title: string, detail: string): Slot => ({ time, cls, title, detail });
const pick = (pool: string[], idx: number, empty: string) => pool.length ? pool[idx % pool.length] : empty;

type Queues = { physics: SubjectQueues; chem: SubjectQueues; math: SubjectQueues };

function planFor(date: Date, q: Queues): { phaseLabel: string; slots: Slot[] } {
  const dow = date.getDay();
  const phase = phaseOf(date);
  let slots: Slot[] = [];
  let phaseLabel = '';

  if (phase === 1) {
    phaseLabel = 'Phase 1 · Syllabus completion';
    if (dow === 0) {
      phaseLabel += ' · Weekly test day';
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Formula revision', "Full recap of this week's Physics, Chemistry & Maths formulas"),
        mk('9:30 AM – 12:45 PM', 'rev', 'Weekly chapter test', "Simulate a JEE-pattern test on this week's topics (~3 hrs)"),
        mk('6:00 – 8:30 PM', 'break', 'PW class / catch-up', 'Attend class if scheduled, else clear pending doubts'),
        mk('8:50 – 10:00 PM', 'break', 'PW class (contd.) / catch-up', 'Finish pending module work'),
        mk('10:00 PM – 1:00 AM', 'rev', 'Test analysis', "Review every mistake, update error log, plan next week's topics"),
      ];
    } else {
      const idx = countIndex(START, date, [0]);
      const revP = pick(q.physics.revisionPool, idx, 'Free revision — pick any weak topic');
      const revC = pick(q.chem.revisionPool, idx, 'Free revision — pick any weak topic');
      const revM = pick(q.math.revisionPool, idx, 'Free revision — pick any weak topic');
      const pItem = pick(q.physics.queue, idx, 'All chapters covered — extra practice / PYQs');
      const pLabel = q.physics.queue.length && (idx % q.physics.queue.length) < q.physics.partialLen ? 'Physics — finish & practice: ' : 'Physics — new topic: ';
      const cItem = pick(q.chem.queue, idx, 'All chapters covered — extra practice / PYQs');
      const cLabel = q.chem.queue.length && (idx % q.chem.queue.length) < q.chem.partialLen ? 'Chemistry — finish & practice: ' : 'Chemistry — new topic: ';
      const mItem = pick(q.math.queue, idx, 'All chapters covered — extra practice / PYQs');
      const mLabel = q.math.queue.length && (idx % q.math.queue.length) < q.math.partialLen ? 'Maths — finish & practice: ' : 'Maths — new topic: ';
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Morning revision', `Physics: ${revP} · Chemistry: ${revC} · Maths: ${revM} (fast recall of already-completed chapters)`),
        mk('9:30 AM – 12:45 PM', 'phy', pLabel + pItem, 'Physics gets the biggest block — prioritized by your live completion status'),
        mk('6:00 – 8:30 PM', 'break', 'PW Lakshya live class', 'Attend scheduled class, take notes, solve in-class questions'),
        mk('8:50 – 10:00 PM', 'break', 'PW Lakshya class (contd.)', 'Finish class + solve assigned module questions'),
        mk('10:00 – 11:30 PM', 'chem', cLabel + cItem, 'Practice-heavy — pulled from your live syllabus progress'),
        mk('11:30 PM – 1:00 AM', 'math', mLabel + mItem, 'Pulled from your live syllabus progress'),
      ];
    }
  } else if (phase === 2) {
    phaseLabel = 'Phase 2 · Revision + regular mocks';
    if (dow === 0) {
      phaseLabel += ' · Full mock day';
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Light warm-up', 'Formula flip-through only, stay relaxed'),
        mk('9:30 AM – 12:45 PM', 'rev', 'FULL MOCK TEST', 'Complete JEE-pattern mock, 3 hrs, exam-like conditions'),
        mk('6:00 – 8:30 PM', 'break', 'PW class / rest', 'Attend if scheduled, else rest'),
        mk('8:50 – 10:00 PM', 'break', 'PW class (contd.)', '—'),
        mk('10:00 PM – 1:00 AM', 'rev', 'Deep mock analysis', 'Subject-wise accuracy check, log every error, review time management'),
      ];
    } else if (dow === 3) {
      phaseLabel += ' · Mid-week test day';
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Formula sheet review', 'All 3 subjects, quick pass'),
        mk('9:30 AM – 12:45 PM', 'rev', 'Subject test', 'Timed test — rotate Physics/Chem/Maths (~50 Qs)'),
        mk('6:00 – 8:30 PM', 'break', 'PW class / self-study', '—'),
        mk('8:50 – 10:00 PM', 'break', 'PW class (contd.)', '—'),
        mk('10:00 PM – 1:00 AM', 'rev', 'Test analysis + error log', "Fix mistakes immediately, don't defer them"),
      ];
    } else {
      const idx = countIndex(P1_END, date, [0, 3]);
      const p = pick(q.physics.all, idx, 'Physics — mixed PYQs');
      const c = pick(q.chem.all, idx, 'Chemistry — mixed PYQs');
      const m = pick(q.math.all, idx, 'Maths — mixed PYQs');
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Error log review', "Revisit yesterday's mistakes across all 3 subjects"),
        mk('9:30 AM – 12:45 PM', 'phy', 'Physics revision: ' + p, 'Revisit theory + solve ~25 PYQs on this topic'),
        mk('6:00 – 8:30 PM', 'break', 'PW revision class / self-study', 'Follow PW revision series or revise weak topics'),
        mk('8:50 – 10:00 PM', 'break', 'PW class (contd.)', 'Module practice'),
        mk('10:00 – 11:30 PM', 'math', 'Maths speed drill: ' + m, 'Timed problem sets, aim under 3 min/question'),
        mk('11:30 PM – 1:00 AM', 'chem', 'Chemistry revision: ' + c, 'Reactions, mechanisms, quick recall'),
      ];
    }
  } else if (phase === 3) {
    phaseLabel = 'Phase 3 · Intensive mock mode';
    const idx = countIndex(P2_END, date, []);
    const isMockDay = idx % 2 === 0;
    if (isMockDay) {
      phaseLabel += ' · Full mock day';
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Warm-up revision', 'Formula sheets only, stay light'),
        mk('9:30 AM – 12:45 PM', 'rev', 'FULL MOCK TEST', 'Exam-pattern, 3 hrs — treat it as the real exam'),
        mk('6:00 – 8:30 PM', 'break', 'Rest / light revision', 'Let the brain recover'),
        mk('8:50 – 10:00 PM', 'break', 'Light revision', 'Revisit 1–2 weak concepts only'),
        mk('10:00 PM – 1:00 AM', 'rev', 'Mock analysis', 'Full analysis — errors, timing, accuracy per subject'),
      ];
    } else {
      phaseLabel += ' · Analysis + repair day';
      const p = pick(q.physics.all, idx, 'Physics — mixed PYQs');
      const c = pick(q.chem.all, idx, 'Chemistry — mixed PYQs');
      const m = pick(q.math.all, idx, 'Maths — mixed PYQs');
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Error log revisit', "Yesterday's mock mistakes"),
        mk('9:30 AM – 12:45 PM', 'phy', 'Physics weak-topic repair: ' + p, 'Focused fix + practice'),
        mk('6:00 – 8:30 PM', 'break', 'Self-study', 'Revise using PW notes/recordings'),
        mk('8:50 – 10:00 PM', 'break', 'Self-study (contd.)', '—'),
        mk('10:00 – 11:30 PM', 'math', 'Maths PYQs: ' + m, 'Targeted practice'),
        mk('11:30 PM – 1:00 AM', 'chem', 'Chemistry recall: ' + c, 'Quick theory + questions'),
      ];
    }
  } else {
    phaseLabel = 'Phase 4 · Final taper';
    const idx = countIndex(P3_END, date, []);
    const isMockDay = idx % 2 === 0;
    if (isMockDay) {
      phaseLabel += ' · Mock (exam-slot timing)';
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Light formula flip-through', 'No new content, just recall'),
        mk('9:30 AM – 12:45 PM', 'rev', 'FULL MOCK (exam-slot timing)', 'Simulate exact JEE exam timing & conditions'),
        mk('6:00 – 8:30 PM', 'break', 'Rest', 'Light walk, no heavy studying'),
        mk('8:50 – 10:00 PM', 'break', 'Light revision', 'Skim formula sheets only'),
        mk('10:00 PM – 1:00 AM', 'rev', 'Quick analysis + early wind-down', 'Start shifting sleep earlier this week'),
      ];
    } else {
      phaseLabel += ' · Light revision day';
      slots = [
        mk('7:30 – 8:30 AM', 'rev', 'Formula sheets', 'Physics + Chem + Maths, light recall only'),
        mk('9:30 AM – 12:45 PM', 'rev', 'Light PYQ practice', 'One previous-year paper, section-wise, relaxed pace'),
        mk('6:00 – 8:30 PM', 'break', 'Rest / revise notes', '—'),
        mk('8:50 – 10:00 PM', 'break', 'Light revision', '—'),
        mk('10:00 PM – 1:00 AM', 'rev', 'Early wind-down', 'Sleep earlier — align body clock to exam-day timing'),
      ];
    }
  }
  return { phaseLabel, slots };
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PHASES = [
  { label: 'Phase 1', range: '14 Jul – 14 Oct', desc: 'Syllabus completion' },
  { label: 'Phase 2', range: '15 Oct – 30 Nov', desc: 'Revision + mocks' },
  { label: 'Phase 3', range: '1 – 20 Dec', desc: 'Intensive mock mode' },
  { label: 'Phase 4', range: '21 – 31 Dec', desc: 'Final taper' },
];

export default function PersonalTimetable() {
  const today = useMemo(() => { const t = localDay(new Date()); return t < START ? START : t > END ? END : t; }, []);
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [done, setDone] = useState<string[]>(() => JSON.parse(localStorage.getItem('personal-timetable-complete') || '[]'));
  const [chapters, setChapters] = useState<ApiChapter[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'fallback'>('loading');

  useEffect(() => {
    request('/syllabus')
      .then(({ chapters }) => { setChapters(chapters); setStatus('live'); })
      .catch(() => setStatus('fallback'));
  }, []);

  const queues: Queues = useMemo(() => ({
    physics: bucket(chapters, 'Physics', fallbackPhysics),
    chem: bucket(chapters, 'Chemistry', fallbackChem),
    math: bucket(chapters, 'Mathematics', fallbackMath),
  }), [chapters]);

  const phase = phaseOf(selected);
  const schedule = planFor(selected, queues);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: offset + daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));

  const toggle = (id: string) => setDone(old => {
    const updated = old.includes(id) ? old.filter(x => x !== id) : [...old, id];
    localStorage.setItem('personal-timetable-complete', JSON.stringify(updated));
    return updated;
  });

  return <section className="planner-page personal-timetable-page" id="personal-timetable">
    <div className="planner-heading">
      <div>
        <p className="eyebrow">PERSONAL TIME TABLE · 14 JUL – 31 DEC 2026</p>
        <h1>Your chat-built 5-month plan</h1>
        <p>Built around your live completion status from the Full Syllabus tracker: completed chapters get spaced revision, partial chapters get priority completion, and untouched chapters get full study slots — Physics first, since that's your weakest subject.</p>
        {status === 'loading' && <p className="calendar-note" style={{ marginTop: 8 }}><i />Loading your live syllabus status…</p>}
        {status === 'fallback' && <p className="calendar-note" style={{ marginTop: 8, color: '#e0a25f' }}><i />Couldn't reach the syllabus API — showing your last-known status instead. Check off chapters in Full Syllabus, or restart the backend, to sync this.</p>}
      </div>
      <div className="planner-phase">
        <Target />
        <div><small>CURRENT PHASE</small><b>Phase {phase}</b><span>{PHASES[phase - 1].desc}</span></div>
      </div>
    </div>

    <div className="phase-legend">
      {PHASES.map((p, i) => <span className={'phase-chip' + (phase === i + 1 ? ' active' : '')} key={p.label}><b>{p.label}</b> · {p.range} · {p.desc}</span>)}
    </div>

    <div className="planner-layout">
      <aside className="calendar-card">
        <div className="calendar-title">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button>
          <b>{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</b>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button>
        </div>
        <div className="calendar-weekdays">{weekdays.map(d => <span key={d}>{d}</span>)}</div>
        <div className="calendar-days">{days.map(day => {
          const inMonth = day.getMonth() === month.getMonth();
          const isSelected = dateKey(day) === dateKey(selected);
          const active = day >= START && day <= END;
          return <button key={dateKey(day)} disabled={!active} className={`${!inMonth ? 'outside' : ''} ${isSelected ? 'chosen' : ''} ${active ? 'planned' : ''}`} onClick={() => setSelected(day)}>{day.getDate()}</button>;
        })}</div>
        <p className="calendar-note"><i />Planned dates · 14 Jul – 31 Dec 2026</p>
      </aside>

      <div className="day-plan">
        <div className="day-plan-title">
          <div>
            <p className="eyebrow">{selected.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h2>{schedule.phaseLabel}</h2>
          </div>
          <button onClick={() => { setSelected(today); setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>Today</button>
        </div>
        <div className="plan-blocks">{schedule.slots.map(block => {
          const id = `${dateKey(selected)}-${block.time}`;
          const kind = block.cls === 'break' ? 'coaching' : /mock/i.test(block.title) ? 'mock' : block.cls === 'rev' ? 'revision' : 'prep';
          return <article key={id} className={'plan-block ' + kind}>
            <button className={done.includes(id) ? 'plan-check checked' : 'plan-check'} onClick={() => toggle(id)}>{done.includes(id) && <CircleCheck size={14} />}</button>
            <time>{block.time}</time>
            <div><span>{block.cls === 'phy' ? 'Physics' : block.cls === 'chem' ? 'Chemistry' : block.cls === 'math' ? 'Maths' : block.cls === 'rev' ? 'Revision' : 'Coaching'}</span><h3>{block.title}</h3><p>{block.detail}</p></div>
          </article>;
        })}</div>
      </div>
    </div>

    <div className="planner-principles">
      <article><Clock3 /><div><b>Fixed daily slots</b><span>7:30–8:30 AM, 9:30 AM–12:45 PM, 6–8:30 PM &amp; 8:50–10 PM (PW classes), 10 PM–1 AM.</span></div></article>
      <article><CalendarClock /><div><b>Live-synced</b><span>Pulls chapter status straight from your Full Syllabus tracker — check something off there, see it here.</span></div></article>
      <article><Target /><div><b>No day skipped</b><span>Sundays and holidays are test/mock/analysis days, never rest days.</span></div></article>
    </div>
  </section>;
}
