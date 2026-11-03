export const SEED_PREFIX = 'seed_';
export const EMAIL_DOMAIN = 'seed.iqra.edu.pk';
export const DEFAULT_COUNT = 10000;
export const MAX_COUNT = 50000;

export type Template = { titles: string[]; details: string[] };

const OTHER: Template = {
  titles: [
    'Parking space shortage',
    'Cafeteria queue is too long',
    'Lost and found request',
    'Suggestion for a quiet study area',
  ],
  details: [
    'This has been affecting many students lately.',
    'It would help if someone could look into it this week.',
    'I wanted to report it before it gets worse.',
    'Other people around me have raised the same concern.',
  ],
};

const TEMPLATES: Record<string, Template> = {
  'IT / Equipment': {
    titles: [
      'Projector not working',
      'Lab computer will not start',
      'Printer jammed again',
      'Monitor flickering in lab',
      'Keyboard keys not responding',
      'Scanner not detected',
    ],
    details: [
      'It has been like this since the start of the week.',
      'Other students have noticed the same problem.',
      'It stopped working in the middle of a session.',
      'Please send someone to check before the next class.',
    ],
  },
  'Software and Network': {
    titles: [
      'Wifi keeps disconnecting',
      'Cannot log in to the LMS',
      'Portal not loading',
      'Email password reset not working',
      'Internet very slow in the lab',
      'Software license expired',
    ],
    details: [
      'I tried again after restarting and nothing changed.',
      'It happens every afternoon.',
      'Several classmates have the same issue.',
      'I have an assignment due soon and cannot proceed.',
    ],
  },
  Maintenance: {
    titles: [
      'Water leaking from ceiling',
      'Washroom tap not working',
      'Power outage in the corridor',
      'Lights flickering',
      'Cooler has no cold water',
      'Walls need paint',
    ],
    details: [
      'It looks like it has been getting worse over time.',
      'It is hard to use the area properly right now.',
      'The area was also dirty when I checked.',
      'Please arrange a repair as soon as possible.',
    ],
  },
  'Classroom Facilities': {
    titles: [
      'Broken chairs in classroom',
      'Whiteboard marker missing',
      'AC not cooling',
      'Fan not working',
      'Door will not lock',
      'Window glass cracked',
    ],
    details: [
      'The class is difficult to sit through like this.',
      'This has been the case for more than a week.',
      'Several seats and benches are affected.',
      'Please check the room before the next lecture.',
    ],
  },
  Safety: {
    titles: [
      'Security guard missing at gate',
      'Fire extinguisher expired',
      'Slippery floor near stairs',
      'Theft in the changing room',
      'CCTV camera not working',
      'Harassment near the parking area',
    ],
    details: [
      'This could lead to an accident if not handled.',
      'I felt unsafe and wanted to report it.',
      'Nobody was around when I checked.',
      'Please treat this as urgent.',
    ],
  },
  'Classes and Timetable': {
    titles: [
      'Timetable clash between two courses',
      'Lecture cancelled without notice',
      'Attendance not updated',
      'Section change request',
      'Course registration error',
      'Class schedule not shared',
    ],
    details: [
      'This is affecting my semester planning.',
      'I contacted the teacher but got no reply.',
      'Many students in the section are affected.',
      'I need this sorted before the next week begins.',
    ],
  },
  'Exams and Results': {
    titles: [
      'Result not showing on portal',
      'Marks mismatch in quiz',
      'Datesheet not announced',
      'Exam paper recheck request',
      'GPA calculated incorrectly',
      'Transcript request delayed',
    ],
    details: [
      'I compared it with my own record and it does not match.',
      'The deadline to apply is close.',
      'I submitted a request earlier with no response.',
      'Please review and correct it.',
    ],
  },
  'Website and Social Media': {
    titles: [
      'Website page shows old information',
      'Broken link on the website',
      'Announcement missing on Facebook page',
      'Instagram post has a wrong date',
      'Banner image not loading',
      'Social media page not updated',
    ],
    details: [
      'It might confuse new students.',
      'I noticed it while checking the admission details.',
      'It has been like this for a few days.',
      'Please update it when possible.',
    ],
  },
  'Events and Printing': {
    titles: [
      'Poster printing request delayed',
      'Seminar photography not shared',
      'Event flyer has a spelling mistake',
      'Brochure copies not delivered',
      'Ceremony video not uploaded',
      'Standee not placed for the event',
    ],
    details: [
      'The event date is close and we need it soon.',
      'I submitted the request through the usual process.',
      'Our society is waiting on this.',
      'Please confirm when it will be ready.',
    ],
  },
  Other: OTHER,
};

export function templateFor(categoryName: string): Template {
  return TEMPLATES[categoryName] ?? OTHER;
}

export const CATEGORY_WEIGHTS: Record<string, number> = {
  'IT / Equipment': 14,
  'Software and Network': 14,
  Maintenance: 16,
  'Classroom Facilities': 12,
  Safety: 4,
  'Classes and Timetable': 12,
  'Exams and Results': 10,
  'Website and Social Media': 5,
  'Events and Printing': 5,
  Other: 8,
};
