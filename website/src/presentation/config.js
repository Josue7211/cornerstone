export const TOTAL_SLIDES = 9;
export const MANUAL_HINT = 'MANUAL MODE · ESC exit · arrows/click navigate';
export const AUTO_HINT = 'AUTO MODE · ESC exit · arrows/click override';
export const AUTO_DWELLS = [17000, 19000, 22000, 18000, 21000, 22000, 19000, 18500, 24000];
export const PAGE_SIZE_ALL = 7;
export const TRANSITION_STYLE_BY_SLIDE = ['warp', 'iris', 'warp', 'shard', 'katana', 'parallax', 'pulse', 'scanline', 'finale'];
export const PARTICLE_SHAPE_BY_SLIDE = ['portal', 'sphere', 'helix', 'cube', 'torus', 'wave', 'burst', 'disc', 'vortex'];

export const EXPERIENCE_PROFILES = [
  { experience: 'experience-chip', accent: '#ff4ec5', chapter: 'Title Slide', introStyle: 'ascend', stage: { side: 'right', face: 'normal' }, sceneClass: 'pfs-scene--title', three: 'chip' },
  { experience: 'experience-thesis', accent: '#7a8dff', chapter: 'Introduction & Summary', introStyle: 'peek', stage: { side: 'left', face: 'mirror' }, sceneClass: 'pfs-scene--summary', three: 'chip' },
  { experience: 'experience-research', accent: '#53d7ff', chapter: 'Research Questions & Methods', introStyle: 'jump', stage: { side: 'right', face: 'normal' }, sceneClass: 'pfs-scene--research', three: 'research' },
  { experience: 'experience-research', accent: '#8c9cff', chapter: 'Perspective & Scope', introStyle: 'drop', stage: { side: 'left', face: 'mirror' }, sceneClass: 'pfs-scene--scope', three: 'research' },
  { experience: 'experience-connections', accent: '#ff5ab9', chapter: 'Transdisciplinary Connections', introStyle: 'peek', stage: { side: 'right', face: 'normal' }, sceneClass: 'pfs-scene--connections pfs-scene--scroll', three: 'connections' },
  { experience: 'experience-implications', accent: '#00e6ff', chapter: 'Implications & Conclusions', introStyle: 'jump', stage: { side: 'left', face: 'mirror' }, sceneClass: 'pfs-scene--implications pfs-scene--scroll', three: 'implications' },
  { experience: 'experience-advocacy', accent: '#00ff88', chapter: 'Advocacy', introStyle: 'ascend', stage: { side: 'right', face: 'normal' }, sceneClass: 'pfs-scene--advocacy pfs-scene--scroll-auto', three: 'implications' },
  { experience: 'experience-advocacy', accent: '#ffe866', chapter: 'Preparing & Presenting', introStyle: 'drop', stage: { side: 'left', face: 'mirror' }, sceneClass: 'pfs-scene--prep pfs-scene--scroll-auto', three: 'research' },
  { experience: 'experience-finale', accent: '#7bffdd', chapter: 'Questions & Ending', introStyle: 'spark', stage: { side: 'right', face: 'normal' }, sceneClass: 'pfs-scene--finale', three: 'finale' }
];

export const BONZI_LINES = [
  'Gaming GPUs accidentally became the engine of AI.',
  'This shift is not abstract. It is already happening.',
  'Click each research question card to flip it.',
  'Scope is where this argument stays honest.',
  'Try any discipline tag for more problems.',
  'Click any implication card to spotlight it.',
  'This is where the argument turns into advocacy.',
  'This section explains how you built the project itself.',
  'Ending locked. Questions and closing.'
];

export const BONZI_NARRATION_LINES = [
  'Welcome. This story starts with gaming hardware and ends with the infrastructure of modern AI.',
  'The shift is already live: the same chips built for graphics now power language and vision at scale.',
  'This section frames the research questions and method lens. You can flip each card while I walk through it.',
  'Scope defines credibility. What is included and excluded is deliberate so the argument stays defensible.',
  'Try any discipline tag to see one thread at a time, or use all to view a cross-disciplinary sequence.',
  'These implications move from technical design choices into social, policy, and governance consequences.',
  'Advocacy translates analysis into direction: where local hardware, tooling, and policy should go next.',
  'This section covers process discipline: iteration, evidence curation, and delivery strategy.',
  'Finale: questions, synthesis, and closing argument.'
];

export const BONZI_LABELS = [
  'Fun Fact',
  'Context',
  'Interact',
  'Scope',
  'Connections',
  'Implications',
  'Advocacy',
  'Build Notes',
  'Finale'
];

export const CONNECTION_DISCIPLINES = [
  'computer-science',
  'mathematics',
  'economics',
  'psychology',
  'political-science',
  'ethics',
  'environmental-science'
];
