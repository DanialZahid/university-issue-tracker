import { UserRole } from '@/generated/prisma/enums';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/ui/common/sidebar';
import { roleLabels } from '@/utils/role';
import { AppSidebar } from './AppSidebar';

type AppShellProps = {
  user: { name: string; email: string; role: UserRole };
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        variant={user.role === UserRole.ADMIN ? 'admin' : 'user'}
        userName={user.name}
        userEmail={user.email}
        roleLabel={roleLabels[user.role]}
      />
      <SidebarInset>
        <header className='sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4'>
          <SidebarTrigger />
        </header>
        <main className='mx-auto w-full max-w-6xl flex-1 p-4 md:p-6'>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
