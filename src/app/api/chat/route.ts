import { streamText } from 'ai';
import { getCloudAI } from '@/lib/ai/openrouter';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    let query = supabase
      .from('ai_chat_messages')
      .select('id, role, content, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Enforce Daily Limit (20 messages/day)
    const { data: canProceed, error: limitErr } = await supabase.rpc('increment_ai_usage', { p_student_id: user.id });
    if (limitErr || !canProceed) {
      return new NextResponse('Daily AI Chat limit reached (20 messages/day). Please try again tomorrow.', { status: 429 });
    }

    const { messages, lessonContext, lessonId } = await req.json();

    const systemPrompt = `You are an expert AI teaching assistant for an LMS platform. 
The student is currently viewing a lesson. You must help them understand the material, answer their questions, and encourage them.
Do NOT give away direct answers to quizzes. Be friendly, pedagogical, and concise.

CURRENT LESSON CONTEXT:
"""
${lessonContext || 'No specific lesson context provided.'}
"""`;

    const supabaseAdmin = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Save user's question to database
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      try {
        await supabaseAdmin.from('ai_chat_messages').insert({
          student_id: user.id,
          lesson_id: lessonId || null,
          role: 'user',
          content: lastUserMsg.content,
        });
      } catch (dbErr) {
        console.error('Failed to persist user question:', dbErr);
      }
    }

    const cloudAI = await getCloudAI();

    // Multi-tier fallback candidate models if primary is overloaded
    const candidateModels = [
      env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.5-flash:free',
      'deepseek/deepseek-chat:free'
    ];

    // Remove duplicates while preserving order
    const modelsToTry = Array.from(new Set(candidateModels));

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const result = await streamText({
          model: cloudAI(modelName),
          messages,
          system: systemPrompt,
          onFinish: async (event) => {
            if (event.text) {
              try {
                await supabaseAdmin.from('ai_chat_messages').insert({
                  student_id: user.id,
                  lesson_id: lessonId || null,
                  role: 'assistant',
                  content: event.text,
                  model_used: modelName,
                });
              } catch (saveErr) {
                console.error('Failed to persist assistant response:', saveErr);
              }
            }
          },
        });

        return result.toTextStreamResponse();
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or overloaded, attempting fallback...`, err?.message || err);
        lastError = err;
      }
    }

    console.error('All AI fallback models failed:', lastError);
    return new NextResponse('The AI service is temporarily experiencing high upstream traffic. Please try again in a few moments.', { status: 503 });

  } catch (error: any) {
    console.error('Chat Fatal Error:', error);
    return new NextResponse(error?.message || 'Internal Server Error', { status: 500 });
  }
}
