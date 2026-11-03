import { AppShell } from '@/ui/shared/layout';
import { requireManager } from '@/utils/session';

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireManager();
  return <AppShell user={user}>{children}</AppShell>;
}
