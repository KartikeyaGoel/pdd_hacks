import { prisma } from './prisma';

/**
 * Demo User for Hackathon Mode
 * 
 * Provides a hardcoded user for all operations, bypassing authentication.
 * This simplifies the demo and removes the need for OAuth setup.
 */

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@montessori.ai',
  name: 'Demo User',
  image: null,
  emailVerified: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Get the demo user (replaces auth() in API routes)
 */
export function getDemoUser() {
  return DEMO_USER;
}

/**
 * Get the demo user ID
 */
export function getDemoUserId(): string {
  return DEMO_USER.id;
}

/**
 * Ensure the demo user exists in the database
 * This should be called before any database operations that require a user
 */
export async function ensureDemoUserExists(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEMO_USER.id },
    update: {}, // Don't update anything if exists
    create: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
    },
  });
}
