import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { ollama } from 'ai-sdk-ollama';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Enforce Daily Limit (20 messages/day)
    const { data: canProceed, error: limitErr } = await supabase.rpc('increment_ai_usage', { p_student_id: user.id });
    if (limitErr || !canProceed) {
      return new NextResponse('Daily AI Chat limit reached. Please try again tomorrow.', { status: 429 });
    }

    const { messages, lessonContext } = await req.json();

    const systemPrompt = `You are an expert AI teaching assistant for an LMS platform. 
The student is currently viewing a lesson. You must help them understand the material, answer their questions, and encourage them.
Do NOT give away direct answers to quizzes. Be friendly and pedagogical.

CURRENT LESSON CONTEXT:
"""
${lessonContext || 'No specific lesson context provided.'}
"""`;

    // Try Local, then Gemini, then Deepseek
    let model = ollama('llama3.3');
    // For streaming, fallbacks are natively supported via ai provider utils but we can just use gemini for chat if we want stable streaming.
    // However, the user asked for local -> gemini -> deepseek.
    // ai sdk streamText doesn't expose a simple try/catch fallback because it streams.
    // Actually, `fallback()` from `ai` works for `streamText` as well! But wait, `fallback` is not exported in 7.0.68.
    // If it's not exported, we can just use Gemini for streaming chat, or try/catch manually before streaming?
    // You can't try/catch streamText easily without buffering if the stream starts. But if it fails to connect, it throws immediately.
    // So we can try to connect. If it fails, fallback. But let's just use Google Gemini here since it's most reliable for streaming.
    
    // Wait, the user specifically requested local first. Let's try manual fallback for the connection phase.
    
    // But since it streams, let's just use Gemini. I will tell the user that for real-time streaming chat we default to Gemini.
    // Wait, I can just use `try/catch` and if the local model fails to *initialize* the stream, it catches and falls back.
    
    try {
      const result = await streamText({
        model: ollama('llama3.3'),
        messages,
        system: systemPrompt,
      });
      // If we got here, connection succeeded, return stream
      return result.toTextStreamResponse();
    } catch (e) {
      try {
        const result = await streamText({
          model: google('gemini-2.5-flash'), // Flash is better for chat
          messages,
          system: systemPrompt,
        });
        return result.toTextStreamResponse();
      } catch (e2) {
        const result = await streamText({
          model: deepseek('deepseek-chat'),
          messages,
          system: systemPrompt,
        });
        return result.toTextStreamResponse();
      }
    }

  } catch (error) {
    console.error('Chat Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
