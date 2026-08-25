import { streamText } from 'ai';
import { openrouter, FREE_MODELS } from '@/lib/ai/openrouter';
import { ollama } from 'ai-sdk-ollama';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    try {
      const result = await streamText({
        model: ollama('llama3.3'),
        messages,
        system: systemPrompt,
      });
      return result.toTextStreamResponse();
    } catch (e) {
      try {
        const result = await streamText({
          model: openrouter(FREE_MODELS.chat),
          messages,
          system: systemPrompt,
        });
        return result.toTextStreamResponse();
      } catch (e2) {
        const result = await streamText({
          model: openrouter(FREE_MODELS.fallback),
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
