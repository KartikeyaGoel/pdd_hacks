import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma" // Assuming your prisma client is exported here
import { z } from "zod"
import bcrypt from "bcryptjs"

// 1. Type Augmentation
// We extend the default Session and JWT types to include custom user properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      // Add other custom fields here
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
  }
}

// 2. Validation Schema for Credentials
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// 3. Auth Configuration
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login", // Custom login page path
    error: "/error", // Error page path
  },
  providers: [
    // OAuth Provider Example
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Allow linking if email matches
    }),
    // Credentials Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = signInSchema.safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.password) return null

          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) {
            // Return user object to be saved in JWT
            return user
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    // Authorized callback is used to verify if the request is authorized to access a page via Middleware
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Optional: Redirect logged-in users away from login page
        // return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
    
    // JWT Callback: Called whenever a JSON Web Token is created or updated
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      // Handle session updates (e.g. updating profile data on client side)
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },

    // Session Callback: Called whenever a session is checked
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        // Ensure email is passed through if available in token
        if (token.email) session.user.email = token.email
      }
      return session
    }
  },
  // Events are useful for logging
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
  },
  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
}

// 4. Export Auth Utilities
// These are the main exports used throughout the application
export const { auth, handlers, signIn, signOut } = NextAuth(authConfig)