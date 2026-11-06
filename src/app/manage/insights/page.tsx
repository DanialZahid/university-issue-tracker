import type { Metadata } from 'next';
import {
  CheckCircle2,
  FilePlus2,
  ChartNoAxesCombined,
  Inbox,
  MapPin,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { getDailyTrend, getInsights, managerScope } from '@/db/manage';
import { getDepartmentName } from '@/db/user';
import { queueFiltersSchema } from '@/schemas/queue-filters';
import { BreakdownBars, TrendChart } from '@/ui/manage';
import { PageHeader } from '@/ui/shared/layout';
import { requireManager } from '@/utils/session';

export const metadata: Metadata = { title: 'Insights' };

function Tile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className='flex items-center gap-4 rounded-xl border bg-card p-5 shadow-xs'>
      <span
        className={`flex size-11 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className='size-5' />
      </span>
      <div>
        <p className='text-2xl font-semibold tabular-nums'>{value}</p>
        <p className='text-sm text-muted-foreground'>{label}</p>
      </div>
    </div>
  );
}

export default async function InsightsPage() {
  const user = await requireManager();
  const scope = managerScope(user);
  const [insights, trend, departmentName] = await Promise.all([
    getInsights(scope),
    getDailyTrend(scope, queueFiltersSchema.parse({})),
    user.role === 'DEPARTMENT_HEAD'
      ? getDepartmentName(user.departmentId)
      : null,
  ]);
  const where = departmentName ?? 'all departments';

  return (
    <>
      <PageHeader
        icon={ChartNoAxesCombined}
        title='Insights'
        description={`Trends and open work across ${where}.`}
      />
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-3'>
          <Tile
            icon={Inbox}
            label='Open now'
            value={insights.openCount.toLocaleString('en-US')}
            tone='bg-amber-100 text-amber-700'
          />
          <Tile
            icon={FilePlus2}
            label='Submitted in the last 30 days'
            value={trend
              .reduce((sum, p) => sum + p.submitted, 0)
              .toLocaleString('en-US')}
            tone='bg-sky-100 text-sky-700'
          />
          <Tile
            icon={CheckCircle2}
            label='Resolved in the last 30 days'
            value={insights.resolvedCount.toLocaleString('en-US')}
            tone='bg-green-100 text-green-700'
          />
        </div>
        <TrendChart points={trend} />
        <div className='grid gap-6 lg:grid-cols-2'>
          <BreakdownBars
            title='Open by category'
            icon={Tag}
            rows={insights.byCategory}
          />
          <BreakdownBars
            title='Open by location'
            icon={MapPin}
            rows={insights.byLocation}
          />
        </div>
      </div>
    </>
  );
}
