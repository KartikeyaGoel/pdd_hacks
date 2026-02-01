/**
 * NextAuth v5 API Route Handler
 * 
 * This file exposes the necessary endpoints for authentication (sign-in, sign-out, 
 * session management, callbacks, etc.) using the NextAuth v5 App Router pattern.
 * 
 * All configuration and logic are centralized in @/lib/auth.ts.
 * 
 * Endpoints handled automatically:
 * - GET /api/auth/signin
 * - GET /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/providers
 * - GET /api/auth/csrf
 * - POST /api/auth/signin/:provider
 * - POST /api/auth/signout
 * - POST /api/auth/callback/:provider
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;