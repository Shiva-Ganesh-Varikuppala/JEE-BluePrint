import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Calendar, Target, Sparkles } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { request } from './Auth';

type Snapshot = { date: string; percent: number; subtopicsDone: number; subtopicsTotal: number };

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Analytics() {
  const [history, setHistory] = useState<Snapshot[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Loading /syllabus first ensures today's snapshot is recorded before we read history —
    // the backend upserts a snapshot on every /syllabus load, so this guarantees today's
    // point exists even on a brand-new day.
    request('/syllabus')
      .then(() => request('/syllabus/history'))
      .then(({ history }) => setHistory(history))
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your progress history.'));
  }, []);

  const chartData = useMemo(() => (history || []).map(s => ({ ...s, label: formatDate(s.date) })), [history]);
  const latest = history && history.length ? history[history.length - 1] : null;
  const first = history && history.length ? history[0] : null;
  const change = latest && first ? latest.percent - first.percent : 0;
  const daysTracked = history ? history.length : 0;

  return <section className="analytics-page" id="analytics">
    <div className="analytics-heading">
      <div>
        <p className="eyebrow">PROGRESS OVER TIME</p>
        <h1>Syllabus analytics</h1>
        <p>Every time you open Full Syllabus, today's completion percentage is recorded — this chart is that history, day by day.</p>
      </div>
    </div>

    {error && <p className="tasks-empty" style={{ color: '#e0796f' }}>{error}</p>}

    {!error && !history && <p className="tasks-empty">Loading your progress history…</p>}

    {!error && history && history.length === 0 && <p className="tasks-empty">No history yet — visit Full Syllabus and check off a subtopic, then come back here tomorrow to see your first trend point.</p>}

    {!error && history && history.length > 0 && <>
      <div className="analytics-stats">
        <div className="analytics-stat"><span className="analytics-icon"><Target size={17}/></span><div><small>Current completion</small><b>{latest?.percent ?? 0}%</b></div></div>
        <div className="analytics-stat"><span className="analytics-icon"><Calendar size={17}/></span><div><small>Days tracked</small><b>{daysTracked}</b></div></div>
        <div className="analytics-stat"><span className="analytics-icon"><TrendingUp size={17}/></span><div><small>Change since first snapshot</small><b className={change >= 0 ? 'positive' : 'negative'}>{change >= 0 ? '+' : ''}{change}%</b></div></div>
        <div className="analytics-stat"><span className="analytics-icon"><Sparkles size={17}/></span><div><small>Subtopics done</small><b>{latest?.subtopicsDone ?? 0} <span>/ {latest?.subtopicsTotal ?? 0}</span></b></div></div>
      </div>

      <div className="card analytics-chart-card">
        <div className="card-title"><div><p className="eyebrow">COMPLETION TREND</p><h2>% of syllabus complete</h2></div></div>
        <div className="analytics-graph">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#8b5cf6" stopOpacity="0.25"/>
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2a38"/>
              <XAxis dataKey="label" stroke="#8f8a9e" fontSize={11} tickLine={false}/>
              <YAxis domain={[0, 100]} stroke="#8f8a9e" fontSize={11} tickLine={false} width={34} tickFormatter={v => `${v}%`}/>
<Tooltip
  contentStyle={{
    background: '#201f2c',
    border: '1px solid #383548',
    borderRadius: 10,
    color: '#e9e7f1',
  }}
  formatter={(value) => [`${Number(value ?? 0)}%`, 'Complete']}
/>

<Line
  type="monotone"
  dataKey="percent"
  stroke="#8b5cf6"
  strokeWidth={3}
  dot={{ r: 3, fill: '#8b5cf6' }}
  activeDot={{ r: 5 }}
/>              
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>}
  </section>;
}
