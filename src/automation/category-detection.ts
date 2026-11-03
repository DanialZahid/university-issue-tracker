export const CATEGORY_NAMES = [
  'IT / Equipment',
  'Software and Network',
  'Maintenance',
  'Classroom Facilities',
  'Safety',
  'Classes and Timetable',
  'Exams and Results',
  'Website and Social Media',
  'Events and Printing',
  'Other',
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

const TITLE_WEIGHT = 3;
const DESCRIPTION_WEIGHT = 1;

// Order matters: on a tie, the earlier category wins.
const KEYWORDS: Record<Exclude<CategoryName, 'Other'>, string[]> = {
  'IT / Equipment': [
    'computer',
    'pc',
    'laptop',
    'printer',
    'projector',
    'keyboard',
    'mouse',
    'monitor',
    'scanner',
    'lab pc',
    'hardware',
    'speaker',
    'microphone',
  ],
  'Software and Network': [
    'wifi',
    'wi-fi',
    'internet',
    'network',
    'lms',
    'portal',
    'login',
    'log in',
    'password',
    'email',
    'software',
    'license',
    'server',
    'vpn',
    'moodle',
  ],
  Safety: [
    'fire',
    'harassment',
    'theft',
    'stolen',
    'security',
    'unsafe',
    'accident',
    'injury',
    'threat',
    'bullying',
    'guard',
    'cctv',
    'emergency',
    'danger',
  ],
  Maintenance: [
    'leak',
    'leaking',
    'plumbing',
    'toilet',
    'washroom',
    'water',
    'electricity',
    'power',
    'paint',
    'cleaning',
    'dirty',
    'light',
    'lights',
    'tap',
    'cooler',
    'generator',
  ],
  'Classroom Facilities': [
    'chair',
    'desk',
    'bench',
    'whiteboard',
    'marker',
    'board',
    'ac',
    'air conditioner',
    'fan',
    'heater',
    'seating',
    'door',
    'window',
  ],
  'Classes and Timetable': [
    'timetable',
    'schedule',
    'class',
    'lecture',
    'teacher',
    'attendance',
    'course',
    'section',
    'clash',
    'registration',
    'enrollment',
    'semester',
  ],
  'Exams and Results': [
    'exam',
    'result',
    'grade',
    'marks',
    'gpa',
    'transcript',
    'quiz',
    'recheck',
    'datesheet',
    'question paper',
    'paper',
    'invigilator',
  ],
  'Website and Social Media': [
    'website',
    'web page',
    'social media',
    'facebook',
    'instagram',
    'linkedin',
    'post',
    'banner',
    'page',
    'announcement',
    'youtube',
  ],
  'Events and Printing': [
    'event',
    'poster',
    'printing',
    'brochure',
    'photography',
    'video',
    'ceremony',
    'seminar',
    'flyer',
    'standee',
    'photo',
  ],
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole word or phrase, with optional plural ('printer' matches 'printers',
// but 'class' does not match 'classroom').
const PATTERNS = Object.entries(KEYWORDS).map(([category, words]) => ({
  category: category as Exclude<CategoryName, 'Other'>,
  regexes: words.map(
    (word) =>
      new RegExp(`(?<![a-z0-9])${escapeRegex(word)}(?:s|es)?(?![a-z0-9])`),
  ),
}));

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreText(text: string, regexes: RegExp[]): number {
  let hits = 0;
  for (const regex of regexes) {
    if (regex.test(text)) hits += 1; // each keyword counts once per field
  }
  return hits;
}

export type Detection = { category: CategoryName; score: number };

export function detectCategory(title: string, description: string): Detection {
  const t = normalize(title);
  const d = normalize(description);

  let best: Detection = { category: 'Other', score: 0 };
  for (const { category, regexes } of PATTERNS) {
    const score =
      scoreText(t, regexes) * TITLE_WEIGHT +
      scoreText(d, regexes) * DESCRIPTION_WEIGHT;
    if (score > best.score) best = { category, score };
  }
  return best;
}
