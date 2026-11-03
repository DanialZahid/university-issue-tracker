import { redirect } from 'next/navigation';
import { homePathFor } from '@/utils/role';
import { requireUser } from '@/utils/session';

export default async function HomePage() {
  const user = await requireUser();
  redirect(homePathFor(user.role));
}
