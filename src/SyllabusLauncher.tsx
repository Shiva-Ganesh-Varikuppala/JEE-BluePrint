import { BookOpen, Timer } from 'lucide-react';

export default function SyllabusLauncher() {
  return <div className="section-dock"><button className="focus-launcher" onClick={() => document.getElementById('focus-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><Timer size={18}/><span><b>Focus tools</b><small>Timer · stopwatch · Pomodoro</small></span></button><button className="syllabus-launcher" onClick={() => document.getElementById('syllabus')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><BookOpen size={18}/><span><b>View full syllabus</b><small>92 chapters · personal tracker</small></span><i>→</i></button></div>;
}
