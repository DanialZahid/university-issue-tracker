import 'server-only';

export function isUniversityEmail(email: string) {
  const domain = process.env['UNIVERSITY_EMAIL_DOMAIN']?.trim().toLowerCase();
  if (!domain) return false;
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

export function isAdminEmail(email: string) {
  const admins = (process.env['ADMIN_EMAILS'] ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}
