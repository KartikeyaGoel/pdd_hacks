import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required and optional environment variables at runtime
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().min(1, 'ELEVENLABS_API_KEY is required'),
  ELEVENLABS_AGENT_ID: z.string().optional(),

  // External Tools (optional)
  TOOLHOUSE_API_KEY: z.string().optional(),
  RTRVR_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

/**
 * Validated environment variables
 * Throws an error at startup if required variables are missing
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;
