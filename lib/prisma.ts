import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient Singleton
 *
 * This module implements the singleton pattern for PrismaClient to prevent
 * multiple database connections during development hot-reloading in Next.js.
 *
 * In production, it creates a standard instance.
 * In development, it attaches the instance to the global object to persist
 * across module reloads.
 */

// 1. Extend the global type definition to include the prisma property
// This prevents TypeScript errors when accessing globalThis.prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Create the PrismaClient instance
// We configure logging based on the environment to help with debugging
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// 3. Persist the instance in development
// If we are not in production, save the instance to the global object.
// This ensures that during hot reloads (HMR), we don't create new connection pools repeatedly.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Edge Runtime Note:
 * If this application is deployed to an environment using the Edge Runtime (e.g., Vercel Edge Functions),
 * standard Prisma Client may not work directly without using the Prisma Data Proxy or Prisma Accelerate.
 *
 * If specific edge compatibility is required, ensure your schema.prisma generator is configured
 * correctly (e.g., `provider = "prisma-client-js"` with `previewFeatures = ["driverAdapters"]`
 * if using specific drivers, or using `@prisma/extension-accelerate`).
 */