import type { ComplaintStatus, Priority } from '@/generated/prisma/enums';

export const LIST_VIEWS = ['cards', 'table', 'compact'] as const;
export type ListView = (typeof LIST_VIEWS)[number];

export const VIEW_COOKIES = { queue: 'view-queue', mine: 'view-mine' } as const;

export function parseView(
  value: string | undefined,
  fallback: ListView,
): ListView {
  return (LIST_VIEWS as readonly string[]).includes(value ?? '')
    ? (value as ListView)
    : fallback;
}

export type ComplaintRow = {
  ticketNumber: number;
  title: string;
  status: ComplaintStatus;
  priority: Priority;
  categoryName: string;
  locationName: string;
  locationDetail: string | null;
  departmentName?: string | null;
  createdAt: Date;
  href: string;
};
