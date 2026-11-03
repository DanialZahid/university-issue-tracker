import 'server-only';

export function isUniversityEmail(email: string) {
  const domain = process.env['UNIVERSITY_EMAIL_DOMAIN']?.trim().toLowerCase();
  if (!domain) return false;
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

export function isSuperuserEmail(email: string) {
  const list = (process.env['SUPERUSER_EMAILS'] ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
