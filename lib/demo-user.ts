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
