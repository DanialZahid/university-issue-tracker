import { redirect } from 'next/navigation';
import { UserRole } from '@/generated/prisma/enums';
import { requireUser } from '@/utils/session';

export default async function HomePage() {
  const user = await requireUser();
  redirect(user.role === UserRole.ADMIN ? '/admin' : '/complaints');
}
