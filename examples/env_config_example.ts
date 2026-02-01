// app/api/synthesize/route.ts
import { NextResponse } from "next/server";
// Import the env object from your configuration file
import { env } from "@/lib/env"; 

export async function POST(req: Request) {
  try {
    // 1. Access Server-side variables safely
    // TypeScript knows this is a string because validation passed at startup
    const apiKey = env.ELEVENLABS_API_KEY;
    
    // 2. Access Optional variables
    // TypeScript knows this is string | undefined
    if (env.TOOLHOUSE_API_KEY) {
      console.log("Toolhouse integration enabled");
    }

    // 3. Use variables in logic
    // If NODE_ENV is 'development', we might log extra details
    if (env.NODE_ENV === "development") {
      console.log(`Processing request for DB: ${env.DATABASE_URL}`);
    }

    // Example external API call using the validated key
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey, // Guaranteed to be present
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "Hello world" }),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    // Note: If environment variables were missing at startup, 
    // the app would have crashed before even reaching this route handler.
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * USAGE NOTES:
 * 
 * 1. Client-Side Access:
 *    If you defined variables in the `client` object of env.ts (e.g., NEXT_PUBLIC_APP_URL),
 *    you can import `env` in client components (use 'use client') and access them there.
 *    Attempting to access `env.ELEVENLABS_API_KEY` (a server var) in a client component
 *    will throw a runtime error to prevent leaking secrets.
 * 
 * 2. Type Safety:
 *    env.DATABASE_URL -> typed as string
 *    env.TOOLHOUSE_API_KEY -> typed as string | undefined
 * 
 * 3. CI/CD:
 *    If building in Docker without env vars present, set SKIP_ENV_VALIDATION=1
 *    to bypass the check during the build phase.
 */