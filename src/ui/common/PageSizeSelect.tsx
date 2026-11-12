'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/common/select';

type Props = {
  value: number;
  sizes: readonly number[];
  fallback: number;
  cookie?: string;
};

export function PageSizeSelect({ value, sizes, fallback, cookie }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={String(value)}
      disabled={pending}
      onValueChange={(next) => {
        if (cookie) {
          document.cookie =
            Number(next) === fallback
              ? `${cookie}=; path=/; max-age=0; samesite=lax`
              : `${cookie}=${next}; path=/; max-age=31536000; samesite=lax`;
        }
        const query = new URLSearchParams(params.toString());
        if (Number(next) === fallback) query.delete('size');
        else query.set('size', next);
        query.delete('page');
        query.delete('forwarded');
        const qs = query.toString();
        startTransition(() =>
          router.replace(qs ? `${pathname}?${qs}` : pathname, {
            scroll: false,
          }),
        );
      }}
    >
      <SelectTrigger
        aria-label='Rows per page'
        size='sm'
        className='w-[4.5rem] bg-card'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position='popper' align='end'>
        {sizes.map((s) => (
          <SelectItem key={s} value={String(s)}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
