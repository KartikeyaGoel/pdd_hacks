import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * 
 * Uses globalThis pattern to prevent multiple instances during development
 * hot-reloads. In production, a single instance is created.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
