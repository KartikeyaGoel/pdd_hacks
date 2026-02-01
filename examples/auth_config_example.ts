// ------------------------------------------------------------------
// 1. API Route Handler
// File: app/api/auth/[...nextauth]/route.ts
// ------------------------------------------------------------------
import { handlers } from "@/lib/auth" // Import from your module

// The handlers object contains the GET and POST functions required by Next.js
export const { GET, POST } = handlers

// ------------------------------------------------------------------
// 2. Server Component Usage (e.g., a Dashboard Page)
// File: app/dashboard/page.tsx
// ------------------------------------------------------------------
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  // Fetch the session on the server
  const session = await auth()

  // Although middleware usually handles this, double-checking here is safe
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome back!</h1>
      
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <p><strong>User ID:</strong> {session.user.id}</p>
        <p><strong>Email:</strong> {session.user.email}</p>
        {/* Access custom properties added via module augmentation */}
        <p><strong>Role:</strong> {session.user.role || "User"}</p>
      </div>

      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/" })
        }}
        className="mt-4"
      >
        <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}

// ------------------------------------------------------------------
// 3. Middleware Usage (Protecting Routes)
// File: middleware.ts
// ------------------------------------------------------------------
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth"

// Initialize NextAuth with the config to get the middleware-compatible auth function
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // The 'authorized' callback in authConfig handles the logic here.
  // If 'authorized' returns false, NextAuth automatically redirects to the login page.
  // req.auth is populated with the session if valid.
  const isLoggedIn = !!req.auth
  console.log(`Request to ${req.nextUrl.pathname}, Is Logged In: ${isLoggedIn}`)
})

// Configure which paths the middleware should run on
export const config = {
  // Matcher ignoring static files and api routes not related to auth
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}