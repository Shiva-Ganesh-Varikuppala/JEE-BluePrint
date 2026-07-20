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
      { chapter: 'Units, Dimensions & Errors', formulas: [
        { label: 'Dimensional formula of force', expr: '[F] = [M L T^{-2}]' },
        { label: 'Percentage error', expr: '\\dfrac{\\Delta a}{a}\\times100\\%' },
        { label: 'Combined error — product/quotient', expr: '\\dfrac{\\Delta Z}{Z}=\\dfrac{\\Delta A}{A}+\\dfrac{\\Delta B}{B}' },
      ]},
      { chapter: 'Kinematics', formulas: [
        { label: 'First equation of motion', expr: 'v = u + at' },
        { label: 'Second equation of motion', expr: 's = ut + \\tfrac{1}{2}at^2' },
        { label: 'Third equation of motion', expr: 'v^2 = u^2 + 2as' },
        { label: 'Average velocity', expr: 'v_{avg}=\\dfrac{\\Delta x}{\\Delta t}' },
        { label: 'Relative velocity', expr: 'v_{AB}=v_A-v_B' },
        { label: 'Range of a projectile', expr: 'R = \\dfrac{u^2\\sin 2\\theta}{g}' },
        { label: 'Maximum height', expr: 'H = \\dfrac{u^2\\sin^2\\theta}{2g}' },
        { label: 'Time of flight', expr: 'T = \\dfrac{2u\\sin\\theta}{g}' },
      ]},
      { chapter: "Newton's Laws & Friction", formulas: [
        { label: "Newton's second law", expr: 'F = ma' },
        { label: 'Impulse', expr: 'J=F\\Delta t=\\Delta p' },
        { label: 'Kinetic friction', expr: 'f = \\mu N' },
        { label: 'Maximum static friction', expr: 'f_s \\le \\mu_s N' },
        { label: 'Banking of a road', expr: '\\tan\\theta=\\dfrac{v^2}{rg}' },
      ]},
      { chapter: 'Work, Energy & Power', formulas: [
        { label: 'Work done', expr: 'W = Fd\\cos\\theta' },
        { label: 'Kinetic energy', expr: 'KE = \\tfrac{1}{2}mv^2' },
        { label: 'Gravitational potential energy', expr: 'PE = mgh' },
        { label: 'Elastic potential energy in a spring', expr: 'PE_{spring}=\\tfrac12 kx^2' },
        { label: 'Power', expr: 'P = \\dfrac{W}{t} = Fv' },
        { label: 'Work-energy theorem', expr: 'W_{net} = \\Delta KE' },
      ]},
      { chapter: 'Centre of Mass & Momentum', formulas: [
        { label: 'Centre of mass', expr: 'x_{cm} = \\dfrac{\\sum m_i x_i}{\\sum m_i}' },
        { label: 'Linear momentum', expr: 'p = mv' },
        { label: 'Conservation of momentum', expr: 'm_1u_1+m_2u_2=m_1v_1+m_2v_2' },
        { label: 'Coefficient of restitution', expr: 'e=\\dfrac{v_2-v_1}{u_1-u_2}' },
        { label: 'Elastic collision (1D), velocity of body 1', expr: "v_1' = \\dfrac{(m_1-m_2)u_1+2m_2u_2}{m_1+m_2}" },
      ]},
      { chapter: 'Rotational Motion', formulas: [
        { label: 'Torque', expr: '\\tau = I\\alpha' },
        { label: 'Angular momentum', expr: 'L = I\\omega' },
        { label: 'Relation between linear & angular velocity', expr: 'v=r\\omega' },
        { label: 'Rotational kinetic energy', expr: 'KE_{rot} = \\tfrac{1}{2}I\\omega^2' },
        { label: 'Radius of gyration', expr: 'I = Mk^2' },
        { label: 'Parallel axis theorem', expr: 'I = I_{cm} + Md^2' },
        { label: 'Perpendicular axis theorem', expr: 'I_z = I_x + I_y' },
      ]},
      { chapter: 'Gravitation', formulas: [
        { label: "Newton's law of gravitation", expr: 'F = \\dfrac{Gm_1m_2}{r^2}' },
        { label: 'Acceleration due to gravity', expr: 'g = \\dfrac{GM}{R^2}' },
        { label: 'Gravitational potential energy', expr: 'U=-\\dfrac{GMm}{r}' },
        { label: 'Variation of g with height (h \\ll R)', expr: "g'=g\\left(1-\\dfrac{2h}{R}\\right)" },
        { label: 'Variation of g with depth', expr: "g'=g\\left(1-\\dfrac{d}{R}\\right)" },
        { label: 'Orbital velocity', expr: 'v_o = \\sqrt{\\dfrac{GM}{r}}' },
        { label: 'Escape velocity', expr: 'v_e = \\sqrt{\\dfrac{2GM}{R}}' },
        { label: "Kepler's third law", expr: 'T^2 \\propto r^3' },
      ]},
      { chapter: 'Mechanical Properties of Solids & Fluids', formulas: [
        { label: "Young's modulus", expr: 'Y = \\dfrac{F/A}{\\Delta L/L}' },
        { label: 'Bulk modulus', expr: 'K=-V\\dfrac{dP}{dV}' },
        { label: 'Pressure', expr: 'P = \\dfrac{F}{A}' },
        { label: 'Excess pressure in a liquid drop', expr: '\\Delta P=\\dfrac{2T}{r}' },
        { label: 'Excess pressure in a soap bubble', expr: '\\Delta P=\\dfrac{4T}{r}' },
        { label: "Bernoulli's equation", expr: 'P + \\tfrac{1}{2}\\rho v^2 + \\rho gh = \\text{constant}' },
        { label: 'Equation of continuity', expr: 'A_1v_1 = A_2v_2' },
        { label: "Stokes' law", expr: 'F = 6\\pi\\eta r v' },
      ]},
      { chapter: 'Kinetic Theory of Gases', formulas: [
        { label: 'RMS speed', expr: 'v_{rms}=\\sqrt{\\dfrac{3RT}{M}}' },
        { label: 'Average speed', expr: 'v_{avg}=\\sqrt{\\dfrac{8RT}{\\pi M}}' },
        { label: 'Most probable speed', expr: 'v_{p}=\\sqrt{\\dfrac{2RT}{M}}' },
        { label: 'Pressure of an ideal gas', expr: 'P=\\tfrac13\\rho v_{rms}^2' },
      ]},
      { chapter: 'Thermal Properties & Thermodynamics', formulas: [
        { label: 'Heat absorbed', expr: 'Q = mc\\Delta T' },
        { label: 'Ideal gas equation', expr: 'PV = nRT' },
        { label: 'First law of thermodynamics', expr: '\\Delta U = Q - W' },
        { label: 'Relation between Cp and Cv', expr: 'C_p-C_v=R' },
        { label: 'Adiabatic process', expr: 'PV^\\gamma=\\text{constant}' },
        { label: 'Internal energy (ideal gas)', expr: 'U=\\dfrac{f}{2}nRT' },
        { label: 'Efficiency of a heat engine', expr: '\\eta = 1 - \\dfrac{T_2}{T_1}' },
        { label: 'Linear thermal expansion', expr: '\\Delta L = L\\alpha\\Delta T' },
      ]},
      { chapter: 'Oscillations & Waves', formulas: [
        { label: 'SHM displacement', expr: 'x = A\\sin(\\omega t+\\phi)' },
        { label: 'Total energy in SHM', expr: 'E=\\tfrac12 kA^2' },
        { label: 'Time period — spring', expr: 'T = 2\\pi\\sqrt{\\dfrac{m}{k}}' },
        { label: 'Springs in series', expr: '\\dfrac{1}{k_{eq}}=\\dfrac{1}{k_1}+\\dfrac{1}{k_2}' },
        { label: 'Springs in parallel', expr: 'k_{eq}=k_1+k_2' },
        { label: 'Time period — simple pendulum', expr: 'T = 2\\pi\\sqrt{\\dfrac{l}{g}}' },
        { label: 'Wave speed', expr: 'v = f\\lambda' },
        { label: 'Doppler effect', expr: "f' = f\\dfrac{v\\pm v_o}{v\\mp v_s}" },
      ]},
      { chapter: 'Electrostatics', formulas: [
        { label: "Coulomb's law", expr: 'F = \\dfrac{1}{4\\pi\\epsilon_0}\\dfrac{q_1q_2}{r^2}' },
        { label: 'Electric field due to a point charge', expr: 'E = \\dfrac{kq}{r^2}' },
        { label: 'Electric field due to a dipole (axial)', expr: 'E=\\dfrac{2kp}{r^3}' },
        { label: 'Torque on a dipole', expr: '\\tau=pE\\sin\\theta' },
        { label: 'Electric potential', expr: 'V = \\dfrac{kq}{r}' },
        { label: 'Energy density of electric field', expr: 'u=\\tfrac12\\epsilon_0E^2' },
        { label: 'Parallel plate capacitance', expr: 'C = \\dfrac{\\epsilon_0 A}{d}' },
        { label: 'Energy stored in a capacitor', expr: 'U = \\tfrac{1}{2}CV^2' },
      ]},
      { chapter: 'Current Electricity', formulas: [
        { label: "Ohm's law", expr: 'V = IR' },
        { label: 'Drift velocity', expr: 'I=nAev_d' },
        { label: 'Electrical power', expr: 'P = VI = I^2R' },
        { label: 'Heat dissipated', expr: 'H=I^2Rt' },
        { label: 'Resistivity', expr: 'R = \\rho\\dfrac{L}{A}' },
        { label: 'Temperature dependence of resistance', expr: 'R_t=R_0(1+\\alpha\\Delta T)' },
        { label: 'Resistors in series', expr: 'R_{eq} = \\sum R_i' },
        { label: 'Resistors in parallel', expr: '\\dfrac{1}{R_{eq}} = \\sum \\dfrac{1}{R_i}' },
      ]},
      { chapter: 'Magnetism', formulas: [
        { label: 'Biot–Savart law', expr: 'dB = \\dfrac{\\mu_0}{4\\pi}\\dfrac{I\\,dl\\sin\\theta}{r^2}' },
        { label: 'Force on a moving charge', expr: 'F = qvB\\sin\\theta' },
        { label: 'Force on a current-carrying wire', expr: 'F = BIL\\sin\\theta' },
        { label: 'Torque on a current loop', expr: '\\tau=NIAB\\sin\\theta' },
        { label: 'Magnetic moment', expr: 'm=NIA' },
        { label: 'Force between two parallel currents', expr: '\\dfrac{F}{l}=\\dfrac{\\mu_0I_1I_2}{2\\pi d}' },
        { label: "Ampere's circuital law", expr: '\\oint B\\cdot dl = \\mu_0 I_{enc}' },
      ]},
      { chapter: 'EMI & Alternating Current', formulas: [
        { label: "Faraday's law of EMI", expr: '\\varepsilon = -\\dfrac{d\\phi}{dt}' },
        { label: 'Motional EMF', expr: '\\varepsilon=Bvl' },
        { label: 'Self-induced EMF', expr: '\\varepsilon = -L\\dfrac{dI}{dt}' },
        { label: 'Mutual induction EMF', expr: '\\varepsilon_2=-M\\dfrac{dI_1}{dt}' },
        { label: 'Inductive & capacitive reactance', expr: 'X_L=\\omega L,\\quad X_C=\\dfrac{1}{\\omega C}' },
        { label: 'Impedance of LCR circuit', expr: 'Z = \\sqrt{R^2+(X_L-X_C)^2}' },
        { label: 'RMS value of AC', expr: 'I_{rms}=\\dfrac{I_0}{\\sqrt2}' },
        { label: 'Average power in AC', expr: 'P_{avg}=V_{rms}I_{rms}\\cos\\phi' },
        { label: 'Resonant angular frequency', expr: '\\omega_0=\\dfrac{1}{\\sqrt{LC}}' },
      ]},
      { chapter: 'Ray & Wave Optics', formulas: [
        { label: 'Mirror formula', expr: '\\dfrac{1}{v}+\\dfrac{1}{u}=\\dfrac{1}{f}' },
        { label: 'Magnification (mirror)', expr: 'm=-\\dfrac{v}{u}' },
        { label: 'Lens formula', expr: '\\dfrac{1}{v}-\\dfrac{1}{u}=\\dfrac{1}{f}' },
        { label: 'Magnification (lens)', expr: 'm=\\dfrac{v}{u}' },
        { label: "Lens maker's formula", expr: '\\dfrac{1}{f}=(n-1)\\left(\\dfrac{1}{R_1}-\\dfrac{1}{R_2}\\right)' },
        { label: 'Power of a lens', expr: 'P=\\dfrac1f\\ (f\\text{ in metres})' },
        { label: "Snell's law", expr: 'n_1\\sin\\theta_1=n_2\\sin\\theta_2' },
        { label: 'Critical angle', expr: '\\sin C=\\dfrac1n' },
        { label: 'Fringe width (YDSE)', expr: '\\beta=\\dfrac{\\lambda D}{d}' },
      ]},
      { chapter: 'Dual Nature & Modern Physics', formulas: [
        { label: 'Photoelectric equation', expr: 'h\\nu=\\phi+KE_{max}' },
        { label: 'Work function', expr: '\\phi=h\\nu_0' },
        { label: 'Stopping potential', expr: 'eV_0=h\\nu-\\phi' },
        { label: 'de Broglie wavelength', expr: '\\lambda=\\dfrac{h}{p}' },
        { label: 'Bohr energy levels (H-atom)', expr: 'E_n=-\\dfrac{13.6\\,Z^2}{n^2}\\ \\text{eV}' },
        { label: 'Mass–energy equivalence', expr: 'E=mc^2' },
        { label: 'Binding energy', expr: 'BE=\\Delta m\\,c^2' },
        { label: 'Radioactive decay law', expr: 'N=N_0e^{-\\lambda t}' },
        { label: 'Half-life', expr: 't_{1/2}=\\dfrac{0.693}{\\lambda}' },
      ]},
      { chapter: 'Semiconductor Electronics', formulas: [
        { label: 'Transistor current relation', expr: 'I_E=I_B+I_C' },
        { label: 'Current amplification factor (CE mode)', expr: '\\beta=\\dfrac{I_C}{I_B}' },
        { label: 'Relation between \\alpha and \\beta', expr: '\\beta=\\dfrac{\\alpha}{1-\\alpha}' },
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
        { label: 'Mole fraction', expr: 'x_A=\\dfrac{n_A}{n_A+n_B}' },
      ]},
      { chapter: 'Structure of Atom', formulas: [
        { label: "Bohr's model energy", expr: 'E_n=-\\dfrac{13.6\\,Z^2}{n^2}\\ \\text{eV}' },
        { label: 'Rydberg formula', expr: '\\dfrac{1}{\\lambda}=RZ^2\\left(\\dfrac{1}{n_1^2}-\\dfrac{1}{n_2^2}\\right)' },
        { label: 'de Broglie wavelength', expr: '\\lambda=\\dfrac{h}{mv}' },
        { label: 'Heisenberg uncertainty principle', expr: '\\Delta x\\,\\Delta p\\ge\\dfrac{h}{4\\pi}' },
      ]},
      { chapter: 'Chemical Bonding & Molecular Structure', formulas: [
        { label: 'Bond order', expr: '\\text{Bond order}=\\dfrac{N_b-N_a}{2}' },
        { label: 'Dipole moment', expr: '\\mu=q\\times d' },
      ]},
      { chapter: 'States of Matter', formulas: [
        { label: 'Ideal gas equation', expr: 'PV=nRT' },
        { label: 'Average kinetic energy', expr: 'KE=\\tfrac{3}{2}kT' },
        { label: "Graham's law of diffusion", expr: '\\dfrac{r_1}{r_2}=\\sqrt{\\dfrac{M_2}{M_1}}' },
        { label: "Dalton's law of partial pressures", expr: 'P_{total}=P_1+P_2+\\cdots' },
        { label: 'Van der Waals equation', expr: '\\left(P+\\dfrac{an^2}{V^2}\\right)(V-nb)=nRT' },
      ]},
      { chapter: 'Thermodynamics', formulas: [
        { label: 'First law of thermodynamics', expr: '\\Delta U=q+w' },
        { label: 'Enthalpy', expr: '\\Delta H=\\Delta U+\\Delta (PV)' },
        { label: 'Enthalpy–internal energy relation (gas reactions)', expr: '\\Delta H=\\Delta U+\\Delta n_g RT' },
        { label: 'Gibbs free energy', expr: '\\Delta G=\\Delta H-T\\Delta S' },
        { label: 'Entropy change (reversible)', expr: '\\Delta S=\\dfrac{q_{rev}}{T}' },
      ]},
      { chapter: 'Equilibrium', formulas: [
        { label: 'Equilibrium constant', expr: 'K_c=\\dfrac{[C]^c[D]^d}{[A]^a[B]^b}' },
        { label: 'Relation between Kp and Kc', expr: 'K_p=K_c(RT)^{\\Delta n}' },
        { label: 'pH', expr: '\\text{pH}=-\\log[H^+]' },
        { label: 'Henderson–Hasselbalch equation', expr: '\\text{pH}=pK_a+\\log\\dfrac{[A^-]}{[HA]}' },
        { label: 'Ionic product of water', expr: 'K_w=[H^+][OH^-]=10^{-14}' },
      ]},
      { chapter: 'Redox & Electrochemistry', formulas: [
        { label: 'Nernst equation', expr: 'E=E^\\circ-\\dfrac{0.0591}{n}\\log Q' },
        { label: "Faraday's law of electrolysis", expr: 'w=\\dfrac{Eit}{96500}' },
        { label: 'Relation between \\Delta G and E°', expr: '\\Delta G=-nFE^\\circ_{cell}' },
        { label: 'Molar conductivity', expr: '\\Lambda_m=\\dfrac{\\kappa\\times1000}{M}' },
        { label: "Kohlrausch's law", expr: '\\Lambda_m^\\circ=\\lambda_+^\\circ+\\lambda_-^\\circ' },
      ]},
      { chapter: 'Chemical Kinetics', formulas: [
        { label: 'Rate law', expr: 'r=k[A]^m[B]^n' },
        { label: 'Zero-order integrated rate law', expr: '[A]=[A]_0-kt' },
        { label: 'First-order integrated rate law', expr: 'k=\\dfrac{2.303}{t}\\log\\dfrac{[A]_0}{[A]}' },
        { label: 'Second-order integrated rate law', expr: '\\dfrac{1}{[A]}=\\dfrac{1}{[A]_0}+kt' },
        { label: 'First-order half-life', expr: 't_{1/2}=\\dfrac{0.693}{k}' },
        { label: 'Arrhenius equation', expr: 'k=Ae^{-E_a/RT}' },
      ]},
      { chapter: 'Solutions', formulas: [
        { label: "Raoult's law", expr: 'P=P^\\circ x' },
        { label: 'Relative lowering of vapour pressure', expr: '\\dfrac{P^\\circ-P}{P^\\circ}=x_{solute}' },
        { label: 'Elevation in boiling point', expr: '\\Delta T_b=iK_bm' },
        { label: 'Depression in freezing point', expr: '\\Delta T_f=iK_fm' },
        { label: 'Osmotic pressure', expr: '\\pi=iCRT' },
        { label: "Van't Hoff factor", expr: 'i=\\dfrac{\\text{observed colligative property}}{\\text{calculated colligative property}}' },
        { label: 'Degree of dissociation from i', expr: 'i=1+(n-1)\\alpha' },
        { label: 'Degree of association from i', expr: 'i=1+\\left(\\dfrac1n-1\\right)\\alpha' },
      ]},
      { chapter: 'The Solid State', formulas: [
        { label: 'Edge length — bcc', expr: 'a=\\dfrac{4r}{\\sqrt3}' },
        { label: 'Edge length — fcc', expr: 'a=2\\sqrt2\\,r' },
        { label: 'Atoms per unit cell — bcc', expr: 'Z=2' },
        { label: 'Atoms per unit cell — fcc', expr: 'Z=4' },
        { label: 'Density of unit cell', expr: 'd=\\dfrac{ZM}{N_Aa^3}' },
      ]},
      { chapter: 'Coordination Compounds', formulas: [
        { label: 'EAN rule', expr: '\\text{EAN}=Z-\\text{oxidation state}+2\\times\\text{CN}' },
        { label: 'CFSE (octahedral)', expr: '\\text{CFSE}=(-0.4\\,n_{t_{2g}}+0.6\\,n_{e_g})\\,\\Delta_o' },
      ]},
      { chapter: 'Organic Chemistry — Key Relations', formulas: [
        { label: 'Degree of unsaturation', expr: '\\text{DoU}=\\dfrac{2C+2+N-H}{2}' },
        { label: 'Percentage yield', expr: '\\%\\,\\text{yield}=\\dfrac{\\text{actual}}{\\text{theoretical}}\\times100' },
      ]},
    ],
  },
  {
    subject: 'Mathematics',
    chapters: [
      { chapter: 'Sets', formulas: [
        { label: 'Cardinality of union', expr: 'n(A\\cup B)=n(A)+n(B)-n(A\\cap B)' },
      ]},
      { chapter: 'Matrices & Determinants', formulas: [
        { label: 'Determinant of a 2×2 matrix', expr: '\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}=ad-bc' },
        { label: 'Inverse of a matrix', expr: 'A^{-1}=\\dfrac{1}{|A|}\\,\\text{adj}(A)' },
        { label: "Cramer's rule (2 variables)", expr: 'x=\\dfrac{D_x}{D},\\quad y=\\dfrac{D_y}{D}' },
      ]},
      { chapter: 'Quadratic Equations', formulas: [
        { label: 'Quadratic formula', expr: 'x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}' },
        { label: 'Sum of roots', expr: '\\alpha+\\beta=-\\dfrac{b}{a}' },
        { label: 'Product of roots', expr: '\\alpha\\beta=\\dfrac{c}{a}' },
      ]},
      { chapter: 'Complex Numbers', formulas: [
        { label: 'Modulus', expr: '|z|=\\sqrt{a^2+b^2}' },
        { label: 'Conjugate product', expr: 'z\\bar z=|z|^2' },
        { label: "Euler's form", expr: 'z=re^{i\\theta}' },
        { label: "De Moivre's theorem", expr: '(\\cos\\theta+i\\sin\\theta)^n=\\cos n\\theta+i\\sin n\\theta' },
        { label: 'Sum of nth roots of unity', expr: '1+\\omega+\\omega^2+\\cdots+\\omega^{n-1}=0' },
      ]},
      { chapter: 'Sequence & Series', formulas: [
        { label: 'AP — nth term', expr: 'a_n=a+(n-1)d' },
        { label: 'AP — sum of n terms', expr: 'S_n=\\dfrac{n}{2}\\left[2a+(n-1)d\\right]' },
        { label: 'GP — nth term', expr: 'a_n=ar^{n-1}' },
        { label: 'GP — sum of n terms', expr: 'S_n=\\dfrac{a(r^n-1)}{r-1}' },
        { label: 'GP — sum to infinity', expr: 'S_\\infty=\\dfrac{a}{1-r}\\quad(|r|<1)' },
        { label: 'Sum of first n natural numbers', expr: '\\sum n=\\dfrac{n(n+1)}{2}' },
        { label: 'Sum of squares of first n natural numbers', expr: '\\sum n^2=\\dfrac{n(n+1)(2n+1)}{6}' },
      ]},
      { chapter: 'Binomial Theorem', formulas: [
        { label: 'Binomial expansion', expr: '(x+y)^n=\\sum_{r=0}^{n}\\binom{n}{r}x^{n-r}y^r' },
        { label: 'General term', expr: 'T_{r+1}=\\binom{n}{r}x^{n-r}y^r' },
      ]},
      { chapter: 'Permutations & Combinations', formulas: [
        { label: 'Permutations', expr: '{}^nP_r=\\dfrac{n!}{(n-r)!}' },
        { label: 'Combinations', expr: '{}^nC_r=\\dfrac{n!}{r!(n-r)!}' },
        { label: 'Circular permutations', expr: '(n-1)!' },
      ]},
      { chapter: 'Trigonometry', formulas: [
        { label: 'Pythagorean identity', expr: '\\sin^2\\theta+\\cos^2\\theta=1' },
        { label: 'Sine of sum', expr: '\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B' },
        { label: 'Cosine of sum', expr: '\\cos(A+B)=\\cos A\\cos B-\\sin A\\sin B' },
        { label: 'Half-angle (sine)', expr: '\\sin\\dfrac{A}{2}=\\pm\\sqrt{\\dfrac{1-\\cos A}{2}}' },
        { label: 'Product to sum', expr: '2\\sin A\\cos B=\\sin(A+B)+\\sin(A-B)' },
        { label: 'Sine rule', expr: '\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=\\dfrac{c}{\\sin C}' },
        { label: 'Cosine rule', expr: 'c^2=a^2+b^2-2ab\\cos C' },
      ]},
      { chapter: 'Inverse Trigonometric Functions', formulas: [
        { label: 'Complementary identity', expr: '\\sin^{-1}x+\\cos^{-1}x=\\dfrac{\\pi}{2}' },
        { label: 'Complementary identity (tan/cot)', expr: '\\tan^{-1}x+\\cot^{-1}x=\\dfrac{\\pi}{2}' },
        { label: 'Sum formula', expr: '\\tan^{-1}x+\\tan^{-1}y=\\tan^{-1}\\dfrac{x+y}{1-xy}' },
      ]},
      { chapter: 'Properties of Triangles, Heights & Distances', formulas: [
        { label: "Area of a triangle — Heron's formula", expr: '\\Delta=\\sqrt{s(s-a)(s-b)(s-c)}' },
        { label: 'Area of a triangle — trigonometric form', expr: '\\Delta=\\tfrac12\\,ab\\sin C' },
        { label: 'Circumradius', expr: 'R=\\dfrac{abc}{4\\Delta}' },
        { label: 'Inradius', expr: 'r=\\dfrac{\\Delta}{s}' },
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
        { label: 'Standard limit — sin x / x', expr: '\\lim_{x\\to0}\\dfrac{\\sin x}{x}=1' },
        { label: 'Standard limit — exponential', expr: '\\lim_{x\\to0}\\dfrac{e^x-1}{x}=1' },
        { label: 'Standard limit — logarithm', expr: '\\lim_{x\\to0}\\dfrac{\\ln(1+x)}{x}=1' },
        { label: 'Power rule', expr: '\\dfrac{d}{dx}x^n=nx^{n-1}' },
        { label: 'Derivative of sine & cosine', expr: '\\dfrac{d}{dx}\\sin x=\\cos x,\\quad \\dfrac{d}{dx}\\cos x=-\\sin x' },
        { label: 'Derivative of exponential & log', expr: '\\dfrac{d}{dx}e^x=e^x,\\quad \\dfrac{d}{dx}\\ln x=\\dfrac{1}{x}' },
      ]},
      { chapter: 'Applications of Derivatives', formulas: [
        { label: 'Equation of the tangent', expr: 'y-y_1=f\'(x_1)(x-x_1)' },
        { label: 'Equation of the normal', expr: "y-y_1=-\\dfrac{1}{f'(x_1)}(x-x_1)" },
        { label: "Rolle's theorem", expr: "f'(c)=0\\ \\text{for some } c\\in(a,b)" },
        { label: 'Lagrange\'s mean value theorem', expr: "f'(c)=\\dfrac{f(b)-f(a)}{b-a}" },
      ]},
      { chapter: 'Integration', formulas: [
        { label: 'Power rule for integration', expr: '\\int x^n\\,dx=\\dfrac{x^{n+1}}{n+1}+C' },
        { label: 'Integral of 1/x', expr: '\\int\\dfrac{1}{x}\\,dx=\\ln|x|+C' },
        { label: 'Integral of exponential', expr: '\\int e^x\\,dx=e^x+C' },
        { label: 'Integral of tan x', expr: '\\int\\tan x\\,dx=\\ln|\\sec x|+C' },
        { label: 'Standard inverse-trig integral', expr: '\\int\\dfrac{1}{\\sqrt{a^2-x^2}}\\,dx=\\sin^{-1}\\dfrac{x}{a}+C' },
        { label: 'Integration by parts', expr: '\\int u\\,dv=uv-\\int v\\,du' },
      ]},
      { chapter: 'Differential Equations', formulas: [
        { label: 'Linear DE — integrating factor', expr: '\\dfrac{dy}{dx}+Py=Q,\\quad \\text{I.F.}=e^{\\int P\\,dx}' },
      ]},
      { chapter: 'Vector Algebra', formulas: [
        { label: 'Dot product', expr: '\\vec a\\cdot\\vec b=|\\vec a||\\vec b|\\cos\\theta' },
        { label: 'Cross product magnitude', expr: '|\\vec a\\times\\vec b|=|\\vec a||\\vec b|\\sin\\theta' },
        { label: 'Scalar triple product', expr: '[\\vec a\\ \\vec b\\ \\vec c]=\\vec a\\cdot(\\vec b\\times\\vec c)' },
        { label: 'Projection of a on b', expr: '\\text{proj}=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec b|}' },
      ]},
      { chapter: 'Three Dimensional Geometry', formulas: [
        { label: 'Distance between two points', expr: 'd=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}' },
        { label: 'Direction cosines relation', expr: 'l^2+m^2+n^2=1' },
        { label: 'Angle between two lines', expr: '\\cos\\theta=\\left|\\dfrac{\\vec b_1\\cdot\\vec b_2}{|\\vec b_1||\\vec b_2|}\\right|' },
        { label: 'Equation of a plane (normal form)', expr: 'lx+my+nz=d' },
      ]},
      { chapter: 'Statistics', formulas: [
        { label: 'Mean', expr: '\\bar x=\\dfrac{\\sum x_i}{n}' },
        { label: 'Variance', expr: '\\sigma^2=\\dfrac{\\sum(x_i-\\bar x)^2}{n}' },
        { label: 'Standard deviation', expr: '\\sigma=\\sqrt{\\dfrac{\\sum(x_i-\\bar x)^2}{n}}' },
      ]},
      { chapter: 'Probability', formulas: [
        { label: 'Addition theorem', expr: 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)' },
        { label: 'Conditional probability', expr: 'P(A|B)=\\dfrac{P(A\\cap B)}{P(B)}' },
        { label: "Bayes' theorem", expr: 'P(A_i|B)=\\dfrac{P(B|A_i)P(A_i)}{\\sum_j P(B|A_j)P(A_j)}' },
        { label: 'Binomial distribution', expr: 'P(X=r)=\\binom{n}{r}p^rq^{n-r}' },
        { label: 'Mean of binomial distribution', expr: 'E(X)=np' },
        { label: 'Variance of binomial distribution', expr: '\\text{Var}(X)=npq' },
      ]},
      { chapter: 'Linear Programming', formulas: [
        { label: 'Objective function (to optimize)', expr: 'Z=ax+by' },
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
          <p>{totalFormulas} formulas across {DATA.reduce((t, s) => t + s.chapters.length, 0)} chapters, spanning Physics, Chemistry and Maths — covering every chapter that has real formulas to reference (a few purely conceptual chapters, like GOC or Isomerism, are intentionally left out since there's nothing to look up there).</p>
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
