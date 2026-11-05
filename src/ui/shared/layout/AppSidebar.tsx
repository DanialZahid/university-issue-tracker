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

      {/* Who is signed in: name, then role and department on one line. */}
      <SidebarFooter className='border-t p-4'>
        <div className='flex items-center gap-3'>
          <UserButton />
          <Hint label={userEmail} side='top'>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>{userName}</p>
              <p className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
                <span className='shrink-0 font-medium text-primary'>
                  {roleLabel}
                </span>
                {departmentName && (
                  <>
                    <span aria-hidden='true'>·</span>
                    <DepartmentIcon
                      name={departmentName}
                      className='size-3.5 shrink-0'
                    />
                    <span className='truncate'>{departmentName}</span>
                  </>
                )}
              </p>
            </div>
          </Hint>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
