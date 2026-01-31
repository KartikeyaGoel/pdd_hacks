import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import type { User } from './types';

/**
 * NextAuth v5 Configuration
 * 
 * Uses JWT strategy for serverless compatibility with Prisma adapter
 * for user persistence.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    /**
     * JWT callback - Add user ID to the token
     */
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    /**
     * Session callback - Add user ID and profile to session
     */
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },

    /**
     * Authorized callback - Protect routes
     */
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute = 
        request.nextUrl.pathname.startsWith('/api/') &&
        !request.nextUrl.pathname.startsWith('/api/auth') &&
        !request.nextUrl.pathname.startsWith('/api/webhook');
      
      if (isOnProtectedRoute && !isLoggedIn) {
        return false;
      }
      
      return true;
    },
  },

  events: {
    /**
     * Create user event - Initialize user profile
     */
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
});

/**
 * Helper to get user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return user;
}

/**
 * Helper to require authentication
 * Throws if user is not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    id?: string;
    accessToken?: string;
  }
}
