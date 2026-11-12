import {
  BookOpen,
  Building2,
  Landmark,
  Megaphone,
  Monitor,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  IT: Monitor,
  Administration: Landmark,
  Academics: BookOpen,
  Media: Megaphone,
};

export function departmentIcon(name?: string | null): LucideIcon {
  return (name ? icons[name] : undefined) ?? Building2;
}

export function DepartmentIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const props = { 'aria-hidden': true, className } as const;
  switch (name) {
    case 'IT':
      return <Monitor {...props} />;
    case 'Administration':
      return <Landmark {...props} />;
    case 'Academics':
      return <BookOpen {...props} />;
    case 'Media':
      return <Megaphone {...props} />;
    default:
      return <Building2 {...props} />;
  }
}
