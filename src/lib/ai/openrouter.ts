import { createOpenAI } from '@ai-sdk/openai';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';

// Best free models on OpenRouter/AgentRouter
export const FREE_MODELS = {
  chat: 'meta-llama/llama-3.3-70b-instruct:free',
  coder: 'deepseek/deepseek-chat:free',
  fallback: 'google/gemini-2.5-flash:free'
};

export async function getCloudAI() {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  let baseURL = 'https://openrouter.ai/api/v1';
  
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
    console.error("Failed to load AI gateway setting, falling back to openrouter", e);
  }

  return createOpenAI({
    baseURL,
    apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
  });
}
