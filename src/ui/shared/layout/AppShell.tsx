import { Suspense } from 'react';
import { UserButton } from '@clerk/nextjs';
import { getDepartmentName } from '@/db/user';
import { UserRole } from '@/generated/prisma/enums';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/ui/common/sidebar';
import { ViewAsBar } from '@/demo/ViewAsBar'; // TEMPORARY demo
import { isManager, roleLabels } from '@/utils/role';
import { PageFade } from '@/ui/motion';
import { AppSidebar } from './AppSidebar';
import { Breadcrumbs } from './Breadcrumbs';

type AppShellProps = {
  user: {
    name: string;
    email: string;
    role: UserRole;
    departmentId: string | null;
  };
  children: React.ReactNode;
};

export async function AppShell({ user, children }: AppShellProps) {
  const departmentName =
    user.role === UserRole.DEPARTMENT_HEAD
      ? await getDepartmentName(user.departmentId)
      : null;

  return (
    <SidebarProvider>
      <AppSidebar
        variant={isManager(user.role) ? 'manage' : 'user'}
        userName={user.name}
        userEmail={user.email}
        role={user.role}
        roleLabel={roleLabels[user.role]}
        departmentName={departmentName}
      />
      <SidebarInset>
        <div aria-hidden='true' className='app-backdrop' />
        <header className='sticky top-0 z-10 flex h-14 items-center gap-1 border-b bg-background/90 px-4 backdrop-blur'>
          <SidebarTrigger />
          <span
            aria-hidden='true'
            className='mx-3 h-5 w-px shrink-0 bg-border'
          />
          <Suspense>
            <Breadcrumbs />
          </Suspense>
          <div className='ml-auto flex items-center gap-3'>
            <ViewAsBar />
            {/* Phones: the sidebar is a modal sheet, and Clerk's account menu
                opens outside it, where the sheet blocks taps. So on phones the
                account button lives here instead of in the sidebar. */}
            <span className='flex md:hidden'>
              <UserButton />
            </span>
          </div>
        </header>
        <main className='relative z-[1] mx-auto w-full max-w-7xl flex-1 p-4 md:p-6'>
          <PageFade>{children}</PageFade>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
