import { SEED_PREFIX } from './lib/demo-data';
import { createClient } from './lib/prisma';

async function main(): Promise<void> {
  const prisma = createClient();
  try {
    const users = await prisma.user.findMany({
      where: { clerkId: { startsWith: SEED_PREFIX } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);

    // Audit entries and attachments go with their complaints (cascade).
    const complaints = await prisma.complaint.deleteMany({
      where: { submittedById: { in: ids } },
    });
    const removedUsers = await prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    console.log(
      `Removed ${complaints.count} complaints and ${removedUsers.count} synthetic users.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
