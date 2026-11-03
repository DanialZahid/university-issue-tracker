import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

export function createClient(): PrismaClient {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is missing from .env');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
