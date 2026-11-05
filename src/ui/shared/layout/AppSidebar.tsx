import { UserButton } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';
import { Hint } from '@/ui/common/Hint';
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
      {/* Brand only, same height as the top bar so their borders line up. */}
      <SidebarHeader className='h-14 justify-center border-b bg-linear-to-r from-primary/10 to-transparent px-4 py-0'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm'>
            <GraduationCap className='size-5' />
          </div>
          <p className='text-[13px] leading-tight font-semibold'>
            University Complaint and Issue Tracking Platform
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className='pt-2'>
        <AppSidebarNav variant={variant} />
      </SidebarContent>

      {/* Who is signed in: avatar and name, then role and department below. */}
      <SidebarFooter className='gap-2.5 border-t bg-linear-to-t from-primary/8 to-transparent p-4'>
        <Hint label={userEmail} side='top'>
          <div className='flex min-w-0 items-center gap-3'>
            <UserButton />
            <p className='truncate text-sm font-medium'>{userName}</p>
          </div>
        </Hint>
        <div className='flex flex-wrap items-center justify-between gap-1.5'>
          <span className='inline-flex max-w-full items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary'>
            <span className='truncate'>{roleLabel}</span>
          </span>
          {departmentName && (
            <span className='inline-flex max-w-full items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border'>
              <DepartmentIcon
                name={departmentName}
                className='size-3 shrink-0 text-muted-foreground'
              />
              <span className='truncate'>{departmentName}</span>
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
