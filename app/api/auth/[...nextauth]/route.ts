import { handlers } from '@/lib/auth';

/**
 * NextAuth v5 API Route Handler
 * 
 * This catch-all route exposes all NextAuth endpoints:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/providers
 * - GET/POST /api/auth/callback/:provider
 * - GET /api/auth/csrf
 */
export const { GET, POST } = handlers;
