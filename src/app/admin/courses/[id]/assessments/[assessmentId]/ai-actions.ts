'use server';

import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { openrouter, FREE_MODELS } from '@/lib/ai/openrouter';
import { ollama } from 'ai-sdk-ollama';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const QuizSchema = z.object({
  questions: z.array(z.object({
    prompt: z.string().describe("The question text"),
    explanation: z.string().describe("Explanation for why the correct answer is correct"),
    options: z.array(z.object({
      text: z.string(),
      is_correct: z.boolean()
    })).length(4).describe("Exactly 4 options, only 1 must be correct")
  }))
});

export async function generateQuestionsWithAI(courseId: string, assessmentId: string, topic: string, count: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const aiCall = async (modelConfig: any) => {
      return await generateObject({
        model: modelConfig,
        schema: QuizSchema,
        prompt: `You are an expert instructional designer. Generate exactly ${count} multiple-choice questions about the following topic:
        
"${topic}"

Ensure there is exactly one correct answer per question, and provide a helpful explanation for the correct answer. Make the questions challenging but fair.`
      });
    };

    let result;
    try {
      result = await aiCall(ollama('llama3.3'));
    } catch (localErr) {
      try {
        result = await aiCall(openrouter(FREE_MODELS.chat));
      } catch (geminiErr) {
        result = await aiCall(openrouter(FREE_MODELS.fallback));
      }
    }

    const { questions } = result.object;

    // Validate that at least one option is correct per question
    for (const q of questions) {
      const correctCount = q.options.filter(o => o.is_correct).length;
      if (correctCount !== 1) {
        // Auto-fix if the AI messes up
        q.options.forEach((o, idx) => o.is_correct = (idx === 0));
      }
    }

    // Insert questions and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .insert({
          assessment_id: assessmentId,
          question_type: 'multiple_choice',
          prompt: q.prompt,
          grading_rubric_hint: q.explanation,
          sort_order: 99 + i,
          points: 10
        })
        .select('id')
        .single();
        
      if (qErr) throw qErr;

      const optionsToInsert = q.options.map((opt, idx) => ({
        question_id: qData.id,
        option_text: opt.text,
        is_correct: opt.is_correct,
        sort_order: idx
      }));

      const { error: optErr } = await supabase.from('question_options').insert(optionsToInsert);
      if (optErr) throw optErr;
    }

    revalidatePath(`/admin/courses/${courseId}/assessments/${assessmentId}`);
    return { success: true };

  } catch (err: any) {
    console.error("AI Quiz Gen error:", err);
    return { success: false, error: err.message || "Failed to generate questions" };
  }
}
