import { UserButton } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/ui/common/sidebar';
import { DepartmentIcon } from '@/ui/shared/department';
import { AppSidebarNav } from './AppSidebarNav';
import type { NavVariant } from './nav-items';

type AppSidebarProps = {
  variant: NavVariant;
  userName: string;
  userEmail: string;
  roleLabel: string;
  departmentName?: string | null;
};

export function AppSidebar({
  variant,
  userName,
  userEmail,
  roleLabel,
  departmentName,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className='bg-linear-to-b from-primary/10 to-transparent p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
            <GraduationCap className='size-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm leading-tight font-semibold'>
              University Complaint and Issue Tracking Platform
            </p>
            <div className='mt-1.5 flex flex-wrap gap-1'>
              <span className='inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                {roleLabel}
              </span>
              {departmentName && (
                <span className='inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-xs font-medium text-foreground ring-1 ring-border'>
                  <DepartmentIcon
                    name={departmentName}
                    className='size-3.5 text-muted-foreground'
                  />
                  {departmentName}
                </span>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarNav variant={variant} />
      </SidebarContent>
      <SidebarFooter className='border-t p-4'>
        <div className='flex items-center gap-3'>
          <UserButton />
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>{userName}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {userEmail}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
