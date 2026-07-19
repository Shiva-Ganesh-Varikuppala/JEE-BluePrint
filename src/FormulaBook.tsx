import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Formula = { label: string; expr: string };
type ChapterFormulas = { chapter: string; formulas: Formula[] };
type SubjectFormulas = { subject: 'Physics' | 'Chemistry' | 'Mathematics'; chapters: ChapterFormulas[] };

const DATA: SubjectFormulas[] = [
  {
    subject: 'Physics',
    chapters: [
      { chapter: 'Kinematics', formulas: [
        { label: 'First equation of motion', expr: 'v = u + at' },
        { label: 'Second equation of motion', expr: 's = ut + \\tfrac{1}{2}at^2' },
        { label: 'Third equation of motion', expr: 'v^2 = u^2 + 2as' },
        { label: 'Range of a projectile', expr: 'R = \\dfrac{u^2\\sin 2\\theta}{g}' },
        { label: 'Maximum height', expr: 'H = \\dfrac{u^2\\sin^2\\theta}{2g}' },
        { label: 'Time of flight', expr: 'T = \\dfrac{2u\\sin\\theta}{g}' },
      ]},
      { chapter: "Newton's Laws & Friction", formulas: [
        { label: "Newton's second law", expr: 'F = ma' },
        { label: 'Kinetic friction', expr: 'f = \\mu N' },
        { label: 'Maximum static friction', expr: 'f_s \\le \\mu_s N' },
      ]},
      { chapter: 'Work, Energy & Power', formulas: [
        { label: 'Work done', expr: 'W = Fd\\cos\\theta' },
        { label: 'Kinetic energy', expr: 'KE = \\tfrac{1}{2}mv^2' },
        { label: 'Gravitational potential energy', expr: 'PE = mgh' },
        { label: 'Power', expr: 'P = \\dfrac{W}{t} = Fv' },
        { label: 'Work-energy theorem', expr: 'W_{net} = \\Delta KE' },
      ]},
      { chapter: 'Centre of Mass & Momentum', formulas: [
        { label: 'Centre of mass', expr: 'x_{cm} = \\dfrac{\\sum m_i x_i}{\\sum m_i}' },
        { label: 'Linear momentum', expr: 'p = mv' },
        { label: 'Elastic collision (1D), velocity of body 1', expr: "v_1' = \\dfrac{(m_1-m_2)u_1+2m_2u_2}{m_1+m_2}" },
      ]},
      { chapter: 'Rotational Motion', formulas: [
        { label: 'Torque', expr: '\\tau = I\\alpha' },
        { label: 'Angular momentum', expr: 'L = I\\omega' },
        { label: 'Rotational kinetic energy', expr: 'KE_{rot} = \\tfrac{1}{2}I\\omega^2' },
        { label: 'Parallel axis theorem', expr: 'I = I_{cm} + Md^2' },
        { label: 'Perpendicular axis theorem', expr: 'I_z = I_x + I_y' },
      ]},
      { chapter: 'Gravitation', formulas: [
        { label: "Newton's law of gravitation", expr: 'F = \\dfrac{Gm_1m_2}{r^2}' },
        { label: 'Acceleration due to gravity', expr: 'g = \\dfrac{GM}{R^2}' },
        { label: 'Orbital velocity', expr: 'v_o = \\sqrt{\\dfrac{GM}{r}}' },
        { label: 'Escape velocity', expr: 'v_e = \\sqrt{\\dfrac{2GM}{R}}' },
        { label: "Kepler's third law", expr: 'T^2 \\propto r^3' },
      ]},
      { chapter: 'Mechanical Properties of Solids & Fluids', formulas: [
        { label: "Young's modulus", expr: 'Y = \\dfrac{F/A}{\\Delta L/L}' },
        { label: 'Pressure', expr: 'P = \\dfrac{F}{A}' },
        { label: "Bernoulli's equation", expr: 'P + \\tfrac{1}{2}\\rho v^2 + \\rho gh = \\text{constant}' },
        { label: 'Equation of continuity', expr: 'A_1v_1 = A_2v_2' },
        { label: "Stokes' law", expr: 'F = 6\\pi\\eta r v' },
      ]},
      { chapter: 'Thermal Properties & Thermodynamics', formulas: [
        { label: 'Heat absorbed', expr: 'Q = mc\\Delta T' },
        { label: 'Ideal gas equation', expr: 'PV = nRT' },
        { label: 'First law of thermodynamics', expr: '\\Delta U = Q - W' },
        { label: 'Efficiency of a heat engine', expr: '\\eta = 1 - \\dfrac{T_2}{T_1}' },
        { label: 'Linear thermal expansion', expr: '\\Delta L = L\\alpha\\Delta T' },
      ]},
      { chapter: 'Oscillations & Waves', formulas: [
        { label: 'SHM displacement', expr: 'x = A\\sin(\\omega t+\\phi)' },
        { label: 'Time period — spring', expr: 'T = 2\\pi\\sqrt{\\dfrac{m}{k}}' },
        { label: 'Time period — simple pendulum', expr: 'T = 2\\pi\\sqrt{\\dfrac{l}{g}}' },
        { label: 'Wave speed', expr: 'v = f\\lambda' },
        { label: 'Doppler effect', expr: "f' = f\\dfrac{v\\pm v_o}{v\\mp v_s}" },
      ]},
      { chapter: 'Electrostatics', formulas: [
        { label: "Coulomb's law", expr: 'F = \\dfrac{1}{4\\pi\\epsilon_0}\\dfrac{q_1q_2}{r^2}' },
        { label: 'Electric field due to a point charge', expr: 'E = \\dfrac{kq}{r^2}' },
        { label: 'Electric potential', expr: 'V = \\dfrac{kq}{r}' },
        { label: 'Parallel plate capacitance', expr: 'C = \\dfrac{\\epsilon_0 A}{d}' },
        { label: 'Energy stored in a capacitor', expr: 'U = \\tfrac{1}{2}CV^2' },
      ]},
      { chapter: 'Current Electricity', formulas: [
        { label: "Ohm's law", expr: 'V = IR' },
        { label: 'Electrical power', expr: 'P = VI = I^2R' },
        { label: 'Resistivity', expr: 'R = \\rho\\dfrac{L}{A}' },
        { label: 'Resistors in series', expr: 'R_{eq} = \\sum R_i' },
        { label: 'Resistors in parallel', expr: '\\dfrac{1}{R_{eq}} = \\sum \\dfrac{1}{R_i}' },
      ]},
      { chapter: 'Magnetism', formulas: [
        { label: 'Biot–Savart law', expr: 'dB = \\dfrac{\\mu_0}{4\\pi}\\dfrac{I\\,dl\\sin\\theta}{r^2}' },
        { label: 'Force on a moving charge', expr: 'F = qvB\\sin\\theta' },
        { label: 'Force on a current-carrying wire', expr: 'F = BIL\\sin\\theta' },
        { label: "Ampere's circuital law", expr: '\\oint B\\cdot dl = \\mu_0 I_{enc}' },
      ]},
      { chapter: 'EMI & Alternating Current', formulas: [
        { label: "Faraday's law of EMI", expr: '\\varepsilon = -\\dfrac{d\\phi}{dt}' },
        { label: 'Self-induced EMF', expr: '\\varepsilon = -L\\dfrac{dI}{dt}' },
        { label: 'Inductive & capacitive reactance', expr: 'X_L=\\omega L,\\quad X_C=\\dfrac{1}{\\omega C}' },
        { label: 'Impedance of LCR circuit', expr: 'Z = \\sqrt{R^2+(X_L-X_C)^2}' },
        { label: 'Resonant angular frequency', expr: '\\omega_0=\\dfrac{1}{\\sqrt{LC}}' },
      ]},
      { chapter: 'Ray & Wave Optics', formulas: [
        { label: 'Mirror formula', expr: '\\dfrac{1}{v}+\\dfrac{1}{u}=\\dfrac{1}{f}' },
        { label: 'Lens formula', expr: '\\dfrac{1}{v}-\\dfrac{1}{u}=\\dfrac{1}{f}' },
        { label: "Lens maker's formula", expr: '\\dfrac{1}{f}=(n-1)\\left(\\dfrac{1}{R_1}-\\dfrac{1}{R_2}\\right)' },
        { label: "Snell's law", expr: 'n_1\\sin\\theta_1=n_2\\sin\\theta_2' },
        { label: 'Fringe width (YDSE)', expr: '\\beta=\\dfrac{\\lambda D}{d}' },
      ]},
      { chapter: 'Modern Physics', formulas: [
        { label: 'Photoelectric equation', expr: 'h\\nu=\\phi+KE_{max}' },
        { label: 'de Broglie wavelength', expr: '\\lambda=\\dfrac{h}{p}' },
        { label: 'Bohr energy levels (H-atom)', expr: 'E_n=-\\dfrac{13.6\\,Z^2}{n^2}\\ \\text{eV}' },
        { label: 'Radioactive decay law', expr: 'N=N_0e^{-\\lambda t}' },
        { label: 'Half-life', expr: 't_{1/2}=\\dfrac{0.693}{\\lambda}' },
      ]},
    ],
  },
  {
    subject: 'Chemistry',
    chapters: [
      { chapter: 'Basic Concepts & Mole Concept', formulas: [
        { label: 'Number of moles', expr: 'n=\\dfrac{m}{M}' },
        { label: 'Molarity', expr: 'M=\\dfrac{n}{V(\\text{L})}' },
        { label: 'Molality', expr: 'm=\\dfrac{n_{solute}}{w_{solvent}(\\text{kg})}' },
      ]},
      { chapter: 'Structure of Atom', formulas: [
        { label: "Bohr's model energy", expr: 'E_n=-\\dfrac{13.6\\,Z^2}{n^2}\\ \\text{eV}' },
        { label: 'de Broglie wavelength', expr: '\\lambda=\\dfrac{h}{mv}' },
        { label: 'Heisenberg uncertainty principle', expr: '\\Delta x\\,\\Delta p\\ge\\dfrac{h}{4\\pi}' },
      ]},
      { chapter: 'States of Matter', formulas: [
        { label: 'Ideal gas equation', expr: 'PV=nRT' },
        { label: 'Average kinetic energy', expr: 'KE=\\tfrac{3}{2}kT' },
        { label: 'Van der Waals equation', expr: '\\left(P+\\dfrac{an^2}{V^2}\\right)(V-nb)=nRT' },
      ]},
      { chapter: 'Thermodynamics', formulas: [
        { label: 'First law of thermodynamics', expr: '\\Delta U=q+w' },
        { label: 'Enthalpy', expr: '\\Delta H=\\Delta U+\\Delta (PV)' },
        { label: 'Gibbs free energy', expr: '\\Delta G=\\Delta H-T\\Delta S' },
        { label: 'Entropy change (reversible)', expr: '\\Delta S=\\dfrac{q_{rev}}{T}' },
      ]},
      { chapter: 'Equilibrium', formulas: [
        { label: 'Equilibrium constant', expr: 'K_c=\\dfrac{[C]^c[D]^d}{[A]^a[B]^b}' },
        { label: 'pH', expr: '\\text{pH}=-\\log[H^+]' },
        { label: 'Henderson–Hasselbalch equation', expr: '\\text{pH}=pK_a+\\log\\dfrac{[A^-]}{[HA]}' },
        { label: 'Ionic product of water', expr: 'K_w=[H^+][OH^-]=10^{-14}' },
      ]},
      { chapter: 'Redox & Electrochemistry', formulas: [
        { label: 'Nernst equation', expr: 'E=E^\\circ-\\dfrac{0.0591}{n}\\log Q' },
        { label: "Faraday's law of electrolysis", expr: 'w=\\dfrac{Eit}{96500}' },
        { label: 'Relation between \\Delta G and E°', expr: '\\Delta G=-nFE^\\circ_{cell}' },
      ]},
      { chapter: 'Chemical Kinetics', formulas: [
        { label: 'Rate law', expr: 'r=k[A]^m[B]^n' },
        { label: 'Arrhenius equation', expr: 'k=Ae^{-E_a/RT}' },
        { label: 'First-order half-life', expr: 't_{1/2}=\\dfrac{0.693}{k}' },
        { label: 'Integrated first-order rate law', expr: 'k=\\dfrac{2.303}{t}\\log\\dfrac{[A]_0}{[A]}' },
      ]},
      { chapter: 'Solutions', formulas: [
        { label: "Raoult's law", expr: 'P=P^\\circ x' },
        { label: 'Relative lowering of vapour pressure', expr: '\\dfrac{P^\\circ-P}{P^\\circ}=x_{solute}' },
        { label: 'Elevation in boiling point', expr: '\\Delta T_b=iK_bm' },
        { label: 'Depression in freezing point', expr: '\\Delta T_f=iK_fm' },
        { label: 'Osmotic pressure', expr: '\\pi=iCRT' },
      ]},
      { chapter: 'The Solid State', formulas: [
        { label: 'Edge length — bcc', expr: 'a=\\dfrac{4r}{\\sqrt3}' },
        { label: 'Edge length — fcc', expr: 'a=2\\sqrt2\\,r' },
        { label: 'Density of unit cell', expr: 'd=\\dfrac{ZM}{N_Aa^3}' },
      ]},
      { chapter: 'Organic Chemistry — Key Relations', formulas: [
        { label: 'Degree of unsaturation', expr: '\\text{DoU}=\\dfrac{2C+2+N-H}{2}' },
      ]},
    ],
  },
  {
    subject: 'Mathematics',
    chapters: [
      { chapter: 'Quadratic Equations', formulas: [
        { label: 'Quadratic formula', expr: 'x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}' },
        { label: 'Sum of roots', expr: '\\alpha+\\beta=-\\dfrac{b}{a}' },
        { label: 'Product of roots', expr: '\\alpha\\beta=\\dfrac{c}{a}' },
      ]},
      { chapter: 'Complex Numbers', formulas: [
        { label: 'Modulus', expr: '|z|=\\sqrt{a^2+b^2}' },
        { label: "Euler's form", expr: 'z=re^{i\\theta}' },
        { label: "De Moivre's theorem", expr: '(\\cos\\theta+i\\sin\\theta)^n=\\cos n\\theta+i\\sin n\\theta' },
      ]},
      { chapter: 'Sequence & Series', formulas: [
        { label: 'AP — nth term', expr: 'a_n=a+(n-1)d' },
        { label: 'AP — sum of n terms', expr: 'S_n=\\dfrac{n}{2}\\left[2a+(n-1)d\\right]' },
        { label: 'GP — nth term', expr: 'a_n=ar^{n-1}' },
        { label: 'GP — sum of n terms', expr: 'S_n=\\dfrac{a(r^n-1)}{r-1}' },
        { label: 'GP — sum to infinity', expr: 'S_\\infty=\\dfrac{a}{1-r}\\quad(|r|<1)' },
      ]},
      { chapter: 'Binomial Theorem', formulas: [
        { label: 'Binomial expansion', expr: '(x+y)^n=\\sum_{r=0}^{n}\\binom{n}{r}x^{n-r}y^r' },
        { label: 'General term', expr: 'T_{r+1}=\\binom{n}{r}x^{n-r}y^r' },
      ]},
      { chapter: 'Permutations & Combinations', formulas: [
        { label: 'Permutations', expr: '{}^nP_r=\\dfrac{n!}{(n-r)!}' },
        { label: 'Combinations', expr: '{}^nC_r=\\dfrac{n!}{r!(n-r)!}' },
      ]},
      { chapter: 'Trigonometry', formulas: [
        { label: 'Pythagorean identity', expr: '\\sin^2\\theta+\\cos^2\\theta=1' },
        { label: 'Sine of sum', expr: '\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B' },
        { label: 'Cosine of sum', expr: '\\cos(A+B)=\\cos A\\cos B-\\sin A\\sin B' },
        { label: 'Sine rule', expr: '\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=\\dfrac{c}{\\sin C}' },
        { label: 'Cosine rule', expr: 'c^2=a^2+b^2-2ab\\cos C' },
      ]},
      { chapter: 'Straight Lines', formulas: [
        { label: 'Slope', expr: 'm=\\dfrac{y_2-y_1}{x_2-x_1}' },
        { label: 'Point-slope form', expr: 'y-y_1=m(x-x_1)' },
        { label: 'Distance from a point to a line', expr: 'd=\\dfrac{|Ax_1+By_1+C|}{\\sqrt{A^2+B^2}}' },
      ]},
      { chapter: 'Circles', formulas: [
        { label: 'Standard form', expr: '(x-h)^2+(y-k)^2=r^2' },
        { label: 'General form — centre & radius', expr: 'x^2+y^2+2gx+2fy+c=0,\\ \\text{centre }(-g,-f),\\ r=\\sqrt{g^2+f^2-c}' },
      ]},
      { chapter: 'Conic Sections', formulas: [
        { label: 'Parabola', expr: 'y^2=4ax' },
        { label: 'Ellipse', expr: '\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1' },
        { label: 'Ellipse eccentricity', expr: 'e=\\sqrt{1-\\dfrac{b^2}{a^2}}' },
        { label: 'Hyperbola', expr: '\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1' },
        { label: 'Hyperbola eccentricity', expr: 'e=\\sqrt{1+\\dfrac{b^2}{a^2}}' },
      ]},
      { chapter: 'Limits, Continuity & Differentiability', formulas: [
        { label: 'Standard limit', expr: '\\lim_{x\\to0}\\dfrac{\\sin x}{x}=1' },
        { label: 'Power rule', expr: '\\dfrac{d}{dx}x^n=nx^{n-1}' },
        { label: 'Derivative of sine & cosine', expr: '\\dfrac{d}{dx}\\sin x=\\cos x,\\quad \\dfrac{d}{dx}\\cos x=-\\sin x' },
        { label: 'Derivative of exponential & log', expr: '\\dfrac{d}{dx}e^x=e^x,\\quad \\dfrac{d}{dx}\\ln x=\\dfrac{1}{x}' },
      ]},
      { chapter: 'Integration', formulas: [
        { label: 'Power rule for integration', expr: '\\int x^n\\,dx=\\dfrac{x^{n+1}}{n+1}+C' },
        { label: 'Integral of 1/x', expr: '\\int\\dfrac{1}{x}\\,dx=\\ln|x|+C' },
        { label: 'Integral of exponential', expr: '\\int e^x\\,dx=e^x+C' },
        { label: 'Integration by parts', expr: '\\int u\\,dv=uv-\\int v\\,du' },
      ]},
      { chapter: 'Differential Equations', formulas: [
        { label: 'Linear DE — integrating factor', expr: '\\dfrac{dy}{dx}+Py=Q,\\quad \\text{I.F.}=e^{\\int P\\,dx}' },
      ]},
      { chapter: 'Vector Algebra', formulas: [
        { label: 'Dot product', expr: '\\vec a\\cdot\\vec b=|\\vec a||\\vec b|\\cos\\theta' },
        { label: 'Cross product magnitude', expr: '|\\vec a\\times\\vec b|=|\\vec a||\\vec b|\\sin\\theta' },
      ]},
      { chapter: 'Three Dimensional Geometry', formulas: [
        { label: 'Distance between two points', expr: 'd=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}' },
        { label: 'Direction cosines relation', expr: 'l^2+m^2+n^2=1' },
      ]},
      { chapter: 'Probability', formulas: [
        { label: 'Addition theorem', expr: 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)' },
        { label: 'Conditional probability', expr: 'P(A|B)=\\dfrac{P(A\\cap B)}{P(B)}' },
        { label: "Bayes' theorem", expr: 'P(A_i|B)=\\dfrac{P(B|A_i)P(A_i)}{\\sum_j P(B|A_j)P(A_j)}' },
      ]},
    ],
  },
];

function FormulaItem({ f }: { f: Formula }) {
  return (
    <div className="formula-item">
      <span className="formula-label">{f.label}</span>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$$${f.expr}$$`}</ReactMarkdown>
    </div>
  );
}

const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'] as const;

export default function FormulaBook() {
  const [subject, setSubject] = useState<typeof subjects[number]>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return DATA
      .filter(s => subject === 'All' || s.subject === subject)
      .map(s => ({
        ...s,
        chapters: s.chapters
          .map(c => ({
            ...c,
            formulas: term
              ? c.formulas.filter(f => f.label.toLowerCase().includes(term) || c.chapter.toLowerCase().includes(term))
              : c.formulas,
          }))
          .filter(c => c.formulas.length > 0),
      }))
      .filter(s => s.chapters.length > 0);
  }, [subject, query]);

  const totalFormulas = useMemo(() => DATA.reduce((t, s) => t + s.chapters.reduce((ct, c) => ct + c.formulas.length, 0), 0), []);

  return (
    <section className="formula-book" id="formula-book">
      <div className="formula-heading">
        <div>
          <p className="eyebrow">QUICK REFERENCE</p>
          <h1>Formula book</h1>
          <p>A curated set of the highest-yield formulas across Physics, Chemistry and Maths — {totalFormulas} formulas across {DATA.reduce((t, s) => t + s.chapters.length, 0)} chapters. Not exhaustive by design: this covers what shows up most in JEE, not every line from NCERT.</p>
        </div>
      </div>
      <div className="formula-tools">
        <div className="subject-tabs">{subjects.map(item => <button key={item} className={subject === item ? 'selected' : ''} onClick={() => setSubject(item)}>{item}</button>)}</div>
        <label className="chapter-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search formulas or chapters"/></label>
      </div>
      {filtered.length === 0 && <p className="syllabus-empty">No formulas match your search.</p>}
      <div className="formula-groups">
        {filtered.map(s => (
          <div className="formula-subject-group" key={s.subject}>
            <h2 className={'formula-subject-title ' + s.subject.toLowerCase()}>{s.subject}</h2>
            <div className="formula-chapter-grid">
              {s.chapters.map(c => (
                <div className="formula-chapter-card" key={c.chapter}>
                  <h3>{c.chapter}</h3>
                  {c.formulas.map(f => <FormulaItem f={f} key={f.label}/>)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
