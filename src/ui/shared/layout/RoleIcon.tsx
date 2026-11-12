import { Backpack, Presentation, ShieldCheck, UserRound } from 'lucide-react';
import type { UserRole } from '@/generated/prisma/enums';

// A switch, not a lookup object: ESLint's static-components rule rejects the lookup.
export function RoleIcon({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  switch (role) {
    case 'STUDENT':
      return <Backpack className={className} />;
    case 'FACULTY':
      return <Presentation className={className} />;
    case 'SUPERUSER':
      return <ShieldCheck className={className} />;
    default:
      return <UserRound className={className} />;
  }
}
