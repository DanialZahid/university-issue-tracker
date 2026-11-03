import { randomUUID } from 'node:crypto';
import { faker, fakerEN_CA, fakerEN_GB, fakerEN_US } from '@faker-js/faker';
import type {
  AuditAction,
  ComplaintStatus,
  Priority,
  UserRole,
} from '../src/generated/prisma/enums';
import {
  CATEGORY_WEIGHTS,
  DEFAULT_COUNT,
  EMAIL_DOMAIN,
  MAX_COUNT,
  SEED_PREFIX,
  templateFor,
} from './lib/demo-data';
import { createClient } from './lib/prisma';

const SEED = 20261106;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const CHUNK = 1000;

type UserRow = {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  createdAt: Date;
};

type ComplaintRow = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  locationDetail: string | null;
  estimatedEffortMinutes: number;
  categoryId: string;
  locationId: string;
  submittedById: string;
  departmentId: string;
  assignedAt: Date;
  assignedStaffId: string | null;
  resolvedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
};

type AuditRow = {
  id: string;
  action: AuditAction;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  createdAt: Date;
  complaintId: string;
  performedById: string;
};

function parseCount(): number {
  const args = process.argv.slice(2);
  const i = args.findIndex((a) => a === '--count' || a.startsWith('--count='));
  if (i === -1) return DEFAULT_COUNT;
  const arg = args[i] ?? '';
  const raw = arg.includes('=') ? arg.split('=')[1] : args[i + 1];
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_COUNT) {
    throw new Error(`--count must be a whole number from 1 to ${MAX_COUNT}`);
  }
  return n;
}

const nameGenerators = [fakerEN_US, fakerEN_GB, fakerEN_CA];

function makeName(used: Set<string>, i: number): string {
  const f = nameGenerators[i % nameGenerators.length] ?? fakerEN_US;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 200; attempt++) {
    const first = f.person.firstName();
    const last = f.person.lastName();
    const plain = `${first} ${last}`;
    if (!used.has(plain)) {
      used.add(plain);
      return plain;
    }
    if (attempt >= 30) {
      for (const letter of letters) {
        const withInitial = `${first} ${letter}. ${last}`;
        if (!used.has(withInitial)) {
          used.add(withInitial);
          return withInitial;
        }
      }
    }
  }
  throw new Error('Could not generate a unique name');
}

function emailFor(name: string, i: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${slug}.${i}@${EMAIL_DOMAIN}`;
}

async function insertInChunks<T>(
  label: string,
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await insert(rows.slice(i, i + CHUNK));
    console.log(
      `${label}: ${Math.min(i + CHUNK, rows.length)} / ${rows.length}`,
    );
  }
}

async function main(): Promise<void> {
  const count = parseCount();
  const prisma = createClient();

  try {
    const existing = await prisma.user.count({
      where: { clerkId: { startsWith: SEED_PREFIX } },
    });
    if (existing > 0) {
      throw new Error(
        'Synthetic data already exists. Run "npm run db:seed:clear" first.',
      );
    }

    const [departments, categories, locations, staff] = await Promise.all([
      prisma.department.findMany({ select: { id: true, name: true } }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          baseEffortMinutes: true,
          departmentId: true,
          department: { select: { name: true } },
        },
      }),
      prisma.location.findMany({ select: { id: true, name: true } }),
      prisma.staffMember.findMany({
        where: { isActive: true },
        select: { id: true, departmentId: true },
      }),
    ]);
    if (!departments.length || !categories.length || !locations.length) {
      throw new Error(
        'Reference data is missing. Run "npm run db:seed" first.',
      );
    }

    for (const f of [faker, ...nameGenerators]) f.seed(SEED);
    const now = Date.now();
    const usedNames = new Set<string>();

    // Users: one synthetic head per department plus students and faculty.
    const heads: UserRow[] = departments.map((d, i) => ({
      id: randomUUID(),
      clerkId: `${SEED_PREFIX}head_${i}`,
      name: makeName(usedNames, i),
      email: `seeded.head.${i}@${EMAIL_DOMAIN}`,
      role: 'DEPARTMENT_HEAD',
      departmentId: d.id,
      createdAt: new Date(now - 200 * DAY),
    }));
    const headByDepartment = new Map(
      heads.map((h) => [h.departmentId ?? '', h.id]),
    );

    const userCount = Math.min(2000, Math.max(30, Math.round(count / 20)));
    const submitters: UserRow[] = Array.from({ length: userCount }, (_, i) => {
      const name = makeName(usedNames, i + heads.length);
      return {
        id: randomUUID(),
        clerkId: `${SEED_PREFIX}${i}`,
        name,
        email: emailFor(name, i),
        role: faker.helpers.weightedArrayElement<UserRole>([
          { weight: 90, value: 'STUDENT' },
          { weight: 10, value: 'FACULTY' },
        ]),
        departmentId: null,
        createdAt: faker.date.between({
          from: new Date(now - 200 * DAY),
          to: new Date(now - 181 * DAY),
        }),
      };
    });

    const staffByDepartment = new Map<string, string[]>();
    for (const s of staff) {
      const list = staffByDepartment.get(s.departmentId) ?? [];
      list.push(s.id);
      staffByDepartment.set(s.departmentId, list);
    }

    const weightedCategories = categories.map((c) => ({
      weight: CATEGORY_WEIGHTS[c.name] ?? 5,
      value: c,
    }));

    const complaints: ComplaintRow[] = [];
    const audits: AuditRow[] = [];
    const log = (
      complaintId: string,
      action: AuditAction,
      performedById: string,
      createdAt: Date,
      fromValue: string | null,
      toValue: string | null,
      note: string | null = null,
    ) =>
      audits.push({
        id: randomUUID(),
        action,
        fromValue,
        toValue,
        note,
        createdAt,
        complaintId,
        performedById,
      });

    for (let n = 0; n < count; n++) {
      const category = faker.helpers.weightedArrayElement(weightedCategories);
      const location = faker.helpers.arrayElement(locations);
      const submitter = faker.helpers.arrayElement(submitters);
      const headId =
        headByDepartment.get(category.departmentId) ?? submitter.id;
      const status = faker.helpers.weightedArrayElement<ComplaintStatus>([
        { weight: 35, value: 'PENDING' },
        { weight: 25, value: 'IN_PROGRESS' },
        { weight: 40, value: 'RESOLVED' },
      ]);

      // Non-pending complaints are old enough for their history to fit before now.
      const latest =
        status === 'PENDING'
          ? now
          : status === 'IN_PROGRESS'
            ? now - 3 * DAY
            : now - 8 * DAY;
      const createdAt = faker.date.between({
        from: new Date(now - 180 * DAY),
        to: new Date(latest),
      });

      const template = templateFor(category.name);
      const baseTitle = faker.helpers.arrayElement(template.titles);
      const title = faker.datatype.boolean()
        ? `${baseTitle} in ${location.name}`
        : baseTitle;
      const room = faker.datatype.boolean({ probability: 0.6 })
        ? `Room ${faker.number.int({ min: 101, max: 420 })}`
        : null;
      const [d1, d2] = faker.helpers.arrayElements(template.details, 2);
      const description = `${baseTitle} at ${location.name}${
        room ? `, ${room}` : ''
      }. ${d1 ?? ''} ${d2 ?? ''}`.trim();

      const deptStaff = staffByDepartment.get(category.departmentId) ?? [];
      const assignedStaffId =
        status !== 'PENDING' &&
        deptStaff.length > 0 &&
        faker.datatype.boolean({ probability: 0.85 })
          ? faker.helpers.arrayElement(deptStaff)
          : null;

      const id = randomUUID();
      let resolvedAt: Date | null = null;
      let archivedAt: Date | null = null;

      log(id, 'CREATED', submitter.id, createdAt, null, 'PENDING');
      log(
        id,
        'ASSIGNED',
        submitter.id,
        createdAt,
        null,
        category.department.name,
        'Auto-assigned from category',
      );

      if (status !== 'PENDING') {
        const startedAt = new Date(
          createdAt.getTime() + faker.number.int({ min: 1, max: 48 }) * HOUR,
        );
        log(id, 'STATUS_CHANGED', headId, startedAt, 'PENDING', 'IN_PROGRESS');

        if (status === 'RESOLVED') {
          resolvedAt = new Date(
            startedAt.getTime() + faker.number.int({ min: 2, max: 96 }) * HOUR,
          );
          log(
            id,
            'STATUS_CHANGED',
            headId,
            resolvedAt,
            'IN_PROGRESS',
            'RESOLVED',
          );

          if (
            resolvedAt.getTime() < now - 30 * DAY &&
            faker.datatype.boolean()
          ) {
            archivedAt = new Date(
              resolvedAt.getTime() +
                faker.number.int({ min: 1, max: 14 }) * DAY,
            );
            log(id, 'ARCHIVED', headId, archivedAt, null, null);
          }
        }
      }

      complaints.push({
        id,
        title: title.slice(0, 120),
        description,
        priority: faker.helpers.weightedArrayElement<Priority>([
          { weight: 20, value: 'LOW' },
          { weight: 45, value: 'MEDIUM' },
          { weight: 25, value: 'HIGH' },
          { weight: 10, value: 'CRITICAL' },
        ]),
        status,
        locationDetail: room,
        estimatedEffortMinutes: category.baseEffortMinutes,
        categoryId: category.id,
        locationId: location.id,
        submittedById: submitter.id,
        departmentId: category.departmentId,
        assignedAt: createdAt,
        assignedStaffId,
        resolvedAt,
        archivedAt,
        createdAt,
      });
    }

    // Insert oldest first so ticket numbers follow the timeline.
    complaints.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    await prisma.user.createMany({ data: heads });
    await insertInChunks('Users', submitters, (data) =>
      prisma.user.createMany({ data }),
    );
    await insertInChunks('Complaints', complaints, (data) =>
      prisma.complaint.createMany({ data }),
    );
    await insertInChunks('Audit entries', audits, (data) =>
      prisma.auditLog.createMany({ data }),
    );

    const by = (s: ComplaintStatus) =>
      complaints.filter((c) => c.status === s).length;
    console.log(
      `Done: ${complaints.length} complaints ` +
        `(${by('PENDING')} pending, ${by('IN_PROGRESS')} in progress, ` +
        `${by('RESOLVED')} resolved), ${submitters.length + heads.length} users, ` +
        `${audits.length} audit entries.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
