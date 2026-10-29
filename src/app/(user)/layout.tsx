import { AppShell } from '@/ui/shared/layout';
import { requireUser } from '@/utils/session';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
