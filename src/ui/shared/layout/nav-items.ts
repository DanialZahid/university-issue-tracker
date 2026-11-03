import {
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';

export type NavVariant = 'manage' | 'user';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const navItems: Record<NavVariant, NavItem[]> = {
  user: [
    {
      label: 'My complaints',
      href: '/complaints',
      icon: ClipboardList,
      exact: true,
    },
    { label: 'Submit a complaint', href: '/complaints/new', icon: FilePlus2 },
  ],
  manage: [
    { label: 'Dashboard', href: '/manage', icon: LayoutDashboard, exact: true },
    { label: 'All complaints', href: '/manage/complaints', icon: ListChecks },
  ],
};
