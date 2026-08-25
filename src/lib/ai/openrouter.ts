import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key_if_not_set',
});

// Best free models on OpenRouter
export const FREE_MODELS = {
  chat: 'meta-llama/llama-3.3-70b-instruct:free',
  coder: 'deepseek/deepseek-chat:free', // Note: OpenRouter handles :free tags if available, or falls back to paid if omitted
  fallback: 'google/gemini-2.5-flash:free'
};
