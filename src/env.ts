import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  BUNNY_STREAM_LIBRARY_ID: z.string().optional(),
  BUNNY_STREAM_API_KEY: z.string().optional(),
  BUNNY_STREAM_CDN_HOSTNAME: z.string().optional(),
  SMS_WEBHOOK_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  BUNNY_STREAM_LIBRARY_ID: process.env.BUNNY_STREAM_LIBRARY_ID,
  BUNNY_STREAM_API_KEY: process.env.BUNNY_STREAM_API_KEY,
  BUNNY_STREAM_CDN_HOSTNAME: process.env.BUNNY_STREAM_CDN_HOSTNAME,
  SMS_WEBHOOK_SECRET: process.env.SMS_WEBHOOK_SECRET,
});

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;
