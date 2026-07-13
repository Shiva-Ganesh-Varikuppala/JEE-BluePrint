SYLLABUS = {
    "Mathematics": {
        "Class 12": ["Basic Mathematics (Sets)", "Determinants", "Matrices", "Relations and Functions", "Inverse Trigonometric Functions", "Limits, Continuity and Differentiability", "Methods of Differentiation", "Applications of Derivatives", "Indefinite Integration", "Definite Integration", "Applications of Integrals", "Differential Equations", "Vector Algebra", "Three-Dimensional Geometry", "Probability", "Linear Programming"],
        "Class 11": ["Sets", "Sequence and Series", "Complex Numbers", "Quadratic Equations", "Permutations and Combinations", "Binomial Theorem", "Trigonometric Equations", "Properties of Triangle & Heights and Distances", "Circle", "Parabola", "Ellipse", "Hyperbola", "Straight Lines", "Statistics"],
    },
    "Chemistry": {
        "Class 12": ["Solutions", "Electrochemistry", "Chemical Kinetics", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Coordination Compounds", "The p-Block Elements", "The d- and f-Block Elements", "Salt Analysis", "The Solid State", "Polymers", "Chemistry in Everyday Life"],
        "Class 11": ["Structure of Atom", "Some Basic Concepts of Chemistry", "Redox Reactions", "Classification of Elements and Periodicity in Properties", "Chemical Bonding and Molecular Structure", "States of Matter", "Thermodynamics", "Equilibrium", "The p-Block Elements", "IUPAC Nomenclature", "Isomerism", "General Organic Chemistry (GOC)", "Hydrocarbons", "Purification and Analysis of Organic Compounds", "Hydrogen", "s-Block Elements", "Environmental Chemistry"],
    },
    "Physics": {
        "Class 12": ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics: Materials, Devices and Simple Circuits"],
        "Class 11": ["Mathematical Tools", "Units and Measurements", "Motion in 1D", "Motion in 2D", "Newton's Laws of Motion", "Work, Energy and Power", "Centre of Mass and System of Particles", "Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Kinetic Theory of Gases", "Thermodynamics", "Oscillations", "Waves"],
    },
}

def flattened_syllabus():
    return [dict(subject=subject, grade=grade, title=title) for subject, grades in SYLLABUS.items() for grade, titles in grades.items() for title in titles]
