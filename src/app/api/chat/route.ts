import { streamText } from 'ai';
import { getCloudAI, FREE_MODELS } from '@/lib/ai/openrouter';
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

    const cloudAI = await getCloudAI();
    const model = (process.env.OPENROUTER_API_KEY)
      ? cloudAI(FREE_MODELS.chat)
      : (process.env.OLLAMA_MODEL ? ollama(process.env.OLLAMA_MODEL) : cloudAI(FREE_MODELS.chat));

    const result = await streamText({
      model,
      messages,
      system: systemPrompt,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
