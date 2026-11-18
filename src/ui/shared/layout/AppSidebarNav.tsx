'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/ui/common/sidebar';
import { Button } from '@/ui/common/button';
import { cn } from '@/utils/cn';
import { navItems, primaryAction, type NavVariant } from './nav-items';

export function AppSidebarNav({ variant }: { variant: NavVariant }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const action = primaryAction[variant];
  const actionActive = action ? pathname === action.href : false;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        {action && (
          <Button
            asChild
            className={cn(
              // bg-clip-border: the base button leaves a transparent 1px border that
              // shows the sidebar through it as a light edge.
              'mb-3 h-10 w-full justify-start gap-3 bg-clip-border px-3 text-[15px] shadow-sm [&_svg]:size-5',
              actionActive && 'bg-primary/80 shadow-none',
            )}
          >
            <Link
              href={action.href}
              aria-current={actionActive ? 'page' : undefined}
              onClick={() => setOpenMobile(false)}
            >
              <action.icon />
              {action.label}
            </Link>
          </Button>
        )}
        <SidebarMenu>
          {navItems[variant].map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  // The sliding highlight below replaces the built-in active background.
                  isActive={false}
                  className={cn(
                    'relative isolate h-10 gap-3 px-3 text-[15px] [&>svg]:size-5',
                    isActive && 'font-medium text-sidebar-accent-foreground',
                  )}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setOpenMobile(false)}
                  >
                    {isActive && (
                      <motion.span
                        layoutId='sidebar-active'
                        aria-hidden='true'
                        className='absolute inset-0 -z-10 rounded-md bg-sidebar-accent'
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 40,
                        }}
                      />
                    )}
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
