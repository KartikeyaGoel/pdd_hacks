import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side Environment Variables
   * These variables are only available in the Node.js environment and
   * will throw an error if accessed on the client.
   */
  server: {
    // Core Configuration
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    
    // Database
    DATABASE_URL: z
      .string()
      .url("DATABASE_URL must be a valid URL starting with postgresql://")
      .min(1, "DATABASE_URL is required"),

    // Authentication (NextAuth.js)
    NEXTAUTH_SECRET: z
      .string()
      .min(1, "NEXTAUTH_SECRET is required for session encryption"),
    NEXTAUTH_URL: z
      .string()
      .url("NEXTAUTH_URL must be a valid URL")
      .min(1, "NEXTAUTH_URL is required"),

    // AI Services
    ELEVENLABS_API_KEY: z
      .string()
      .min(1, "ELEVENLABS_API_KEY is required for voice synthesis"),

    // External Tools (Optional)
    TOOLHOUSE_API_KEY: z
      .string()
      .optional()
      .describe("API key for Toolhouse.ai integration"),
    RTRVR_API_KEY: z
      .string()
      .optional()
      .describe("API key for rtrvr.ai web scraping"),
  },

  /**
   * Client-side Environment Variables
   * These variables are exposed to the browser. They must be prefixed with `NEXT_PUBLIC_`.
   * Even if you don't have any currently, keeping the object here makes it easy to add later.
   */
  client: {
    // Example: NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  /**
   * Runtime Environment Variable Destructuring
   * Due to how Next.js bundles environment variables, we need to manually destructure them
   * to ensure the tree-shaking works correctly.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    TOOLHOUSE_API_KEY: process.env.TOOLHOUSE_API_KEY,
    RTRVR_API_KEY: process.env.RTRVR_API_KEY,
  },

  /**
   * Behavior Configuration
   * - skipValidation: Skips validation during build (useful for Docker builds without env vars)
   * - emptyStringAsUndefined: Treats empty strings as undefined (helps with optional keys)
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});