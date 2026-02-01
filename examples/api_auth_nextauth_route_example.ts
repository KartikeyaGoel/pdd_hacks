/**
 * USAGE EXAMPLE: NextAuth v5 API Route Handler
 * 
 * This example shows the complete setup required to make the route handler work.
 * 
 * 1. PREREQUISITE: Create the configuration file at `lib/auth.ts`.
 * 2. IMPLEMENTATION: Create the route handler at `app/api/auth/[...nextauth]/route.ts`.
 */

// ------------------------------------------------------------------
// FILE 1: lib/auth.ts (The Configuration)
// ------------------------------------------------------------------
// This file is imported by the route handler. It initializes NextAuth.

import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

// Define your configuration
export const { 
  handlers, // <-- This is what the route handler imports
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  // Optional: Add callbacks, pages, etc.
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
})


// ------------------------------------------------------------------
// FILE 2: app/api/auth/[...nextauth]/route.ts (The Route Handler)
// ------------------------------------------------------------------
// This is the actual usage of the module provided in the prompt.
// It acts as a bridge between Next.js App Router and Auth.js logic.

import { handlers } from "@/lib/auth"; // Import from the config above

// Exporting GET and POST allows Next.js to handle:
// - GET /api/auth/session
// - GET /api/auth/providers
// - POST /api/auth/signin/:provider
// - POST /api/auth/signout
// - etc.
export const { GET, POST } = handlers;


// ------------------------------------------------------------------
// CLIENT-SIDE USAGE
// ------------------------------------------------------------------
// Once the route handler is set up, you can use the endpoints automatically.

/*
  // Example: Signing in from a client component
  // This sends a POST request to /api/auth/signin/github
  
  import { signIn } from "next-auth/react"
  
  <button onClick={() => signIn("github")}>
    Sign in with GitHub
  </button>
*/