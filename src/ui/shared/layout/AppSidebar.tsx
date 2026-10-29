import { UserButton } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/ui/common/sidebar';
import { AppSidebarNav } from './AppSidebarNav';
import type { NavVariant } from './nav-items';

type AppSidebarProps = {
  variant: NavVariant;
  userName: string;
  userEmail: string;
  roleLabel: string;
};

export function AppSidebar({
  variant,
  userName,
  userEmail,
  roleLabel,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className='p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
            <GraduationCap className='size-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm leading-tight font-semibold'>
              University Complaint and Issue Tracking Platform
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>{roleLabel}</p>
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
