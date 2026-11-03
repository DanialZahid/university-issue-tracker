import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

const departments = [
  {
    name: 'IT',
    headName: 'Michael Carter',
    headEmail: 'it.head@seed.iqra.edu.pk',
    categories: [
      {
        name: 'IT / Equipment',
        description: 'Computers, projectors and lab equipment',
        baseEffortMinutes: 60,
      },
      {
        name: 'Software and Network',
        description: 'Software installs, Wi-Fi and network issues',
        baseEffortMinutes: 90,
      },
    ],
    staff: [
      { name: 'Oliver Bennett', email: 'oliver.bennett@seed.iqra.edu.pk' },
      { name: 'Chloe Anderson', email: 'chloe.anderson@seed.iqra.edu.pk' },
    ],
  },
  {
    name: 'Administration',
    headName: 'Sarah Mitchell',
    headEmail: 'administration.head@seed.iqra.edu.pk',
    categories: [
      {
        name: 'Maintenance',
        description: 'Repairs, plumbing, electricity and cleaning',
        baseEffortMinutes: 240,
      },
      {
        name: 'Classroom Facilities',
        description: 'Furniture, air conditioning and classroom conditions',
        baseEffortMinutes: 180,
      },
      {
        name: 'Safety',
        description: 'Safety hazards and security concerns',
        baseEffortMinutes: 120,
      },
      {
        name: 'Other',
        description: 'Anything that fits no other category',
        baseEffortMinutes: 60,
      },
    ],
    staff: [
      { name: 'Harry Wilson', email: 'harry.wilson@seed.iqra.edu.pk' },
      { name: 'Megan Tremblay', email: 'megan.tremblay@seed.iqra.edu.pk' },
    ],
  },
  {
    name: 'Academics',
    headName: 'James Thompson',
    headEmail: 'academics.head@seed.iqra.edu.pk',
    categories: [
      {
        name: 'Classes and Timetable',
        description:
          'Class schedules, timetable clashes and faculty availability',
        baseEffortMinutes: 120,
      },
      {
        name: 'Exams and Results',
        description: 'Exam arrangements, grading and results',
        baseEffortMinutes: 180,
      },
    ],
    staff: [
      { name: 'Grace Fletcher', email: 'grace.fletcher@seed.iqra.edu.pk' },
      { name: 'Ethan Gagnon', email: 'ethan.gagnon@seed.iqra.edu.pk' },
    ],
  },
  {
    name: 'Media',
    headName: 'Emily Clarke',
    headEmail: 'media.head@seed.iqra.edu.pk',
    categories: [
      {
        name: 'Website and Social Media',
        description: 'University website and social media accounts',
        baseEffortMinutes: 120,
      },
      {
        name: 'Events and Printing',
        description: 'Event coverage, banners and printing',
        baseEffortMinutes: 90,
      },
    ],
    staff: [
      { name: 'Lucas Parker', email: 'lucas.parker@seed.iqra.edu.pk' },
      { name: 'Isla Campbell', email: 'isla.campbell@seed.iqra.edu.pk' },
    ],
  },
];

const locations = [
  'Block A',
  'Block B',
  'Block C',
  'Computer Labs',
  'Library',
  'Cafeteria',
  'Auditorium',
  'Administration Building',
  'Sports Complex',
  'Hostel',
  'Parking Area',
  'Main Gate',
];

async function main() {
  for (const { categories, staff, ...data } of departments) {
    // Head details are only set on first create, so edits made in Studio survive re-runs.
    const department = await prisma.department.upsert({
      where: { name: data.name },
      create: data,
      update: {},
    });

    for (const category of categories) {
      const values = { ...category, departmentId: department.id };
      await prisma.category.upsert({
        where: { name: category.name },
        create: values,
        update: values,
      });
    }

    for (const member of staff) {
      await prisma.staffMember.upsert({
        where: { email: member.email },
        create: { ...member, departmentId: department.id },
        update: { name: member.name, departmentId: department.id },
      });
    }
  }

  for (const name of locations) {
    await prisma.location.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log('Reference data is up to date.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
