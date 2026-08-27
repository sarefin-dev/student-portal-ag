import { createOpenAI } from '@ai-sdk/openai';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';

/**
 * Returns the primary configured model from environment variables
 */
export function getPrimaryAIModel(): string {
  return env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
}

/**
 * Returns the list of fallback models configured in environment variables
 */
export function getFallbackAIModels(): string[] {
  if (!env.OPENROUTER_FALLBACK_MODELS) return [];
  return env.OPENROUTER_FALLBACK_MODELS.split(',')
    .map(m => m.trim())
    .filter(Boolean);
}

/**
 * Returns an ordered deduplicated list of all models to try
 */
export function getAllConfiguredModels(): string[] {
  const primary = getPrimaryAIModel();
  const fallbacks = getFallbackAIModels();
  return Array.from(new Set([primary, ...fallbacks].filter(Boolean)));
}

// Backward-compatibility mapping that reads dynamically from env
export const FREE_MODELS = {
  get chat() {
    return getPrimaryAIModel();
  },
  get coder() {
    return getPrimaryAIModel();
  },
  get fallback() {
    return getFallbackAIModels()[0] || getPrimaryAIModel();
  }
};

export async function getCloudAI() {
  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  let baseURL = env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'ai_gateway')
      .single();
      
    if (data && data.value) {
      baseURL = data.value;
    }
  } catch (e) {
    console.error("Failed to load AI gateway setting, falling back to configured base URL", e);
  }

  return createOpenAI({
    baseURL,
    apiKey: env.OPENROUTER_API_KEY || 'dummy_key',
  });
}
