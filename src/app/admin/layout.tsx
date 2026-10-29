import { AppShell } from '@/ui/shared/layout';
import { requireAdmin } from '@/utils/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return <AppShell user={user}>{children}</AppShell>;
}
