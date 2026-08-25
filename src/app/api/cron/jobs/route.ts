import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { generateObject } from 'ai';
import { getCloudAI, FREE_MODELS } from '@/lib/ai/openrouter';
import { z } from 'zod';

export async function POST(req: Request) {
  // Simple auth check if called by pg_cron (e.g. using a secret header)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Fetch up to 10 pending grade_assessment jobs
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('job_type', 'grade_assessment')
    .eq('status', 'pending')
    .limit(10);

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ message: 'No jobs' });
  }

  

  for (const job of jobs) {
    await supabaseAdmin.from('jobs').update({ status: 'processing' }).eq('id', job.id);
    
    try {
      const attemptId = job.payload.attempt_id;
      
      const { data: attempt } = await supabaseAdmin
        .from('assessment_attempts')
        .select('*, assessments(*, assessment_questions(*))')
        .eq('id', attemptId)
        .single();
        
      if (!attempt) throw new Error("Attempt not found");

      const { data: responses } = await supabaseAdmin
        .from('question_responses')
        .select('*')
        .eq('attempt_id', attemptId);

      let totalEarned = 0;
      let totalPossible = 0;
      let hasManualReview = false;

      for (const q of attempt.assessments.assessment_questions) {
        totalPossible += 100; // Treat each question as 100% internally
        const resp = responses?.find(r => r.question_id === q.id);
        
        let scorePercent = 0;
        let isCorrect = false;
        let feedback = "";
        let aiProvider = null;

        if (q.question_type === 'mcq') {
          const studentOption = resp?.student_answer?.selected_option_id;
          if (studentOption === q.correct_option_id) {
            scorePercent = 100;
            isCorrect = true;
          }
        } else if (q.question_type === 'short_answer') {
          const studentAnswerText = resp?.student_answer?.text || "";
          try {
            const aiCall = async (modelConfig: any) => {
              return await generateObject({
                model: modelConfig,
                schema: z.object({
                  scorePercent: z.number().describe("0 to 100 based on how correct the answer is"),
                  feedback: z.string().describe("Concise, encouraging feedback explaining what they got right or wrong.")
                }),
                prompt: `
                  You are grading a short answer question for a student.
                  Question: ${q.prompt}
                  Ideal Answer / Rubric: ${q.grading_rubric_hint}
                  Student's Answer: ${studentAnswerText}
                  Grade strictly against the rubric. Output a percentage score (0-100) and brief feedback.
                `
              });
            };

            let result;
            try {
              result = await aiCall((await getCloudAI())(FREE_MODELS.coder));
              aiProvider = 'openrouter_primary';
            } catch (err) {
              console.log("OpenRouter primary failed, trying fallback...", err);
              result = await aiCall((await getCloudAI())(FREE_MODELS.fallback));
              aiProvider = 'openrouter_fallback';
            }

            scorePercent = result.object.scorePercent;
            isCorrect = scorePercent >= 70; // 70% threshold per question
            feedback = result.object.feedback;
          } catch (err) {
            console.error("AI Grading failed on both providers:", err);
            hasManualReview = true;
            feedback = "Pending manual instructor review.";
          }
        }

        totalEarned += scorePercent;
        
        if (resp) {
          await supabaseAdmin.from('question_responses').update({
            is_correct: isCorrect,
            ai_score_percent: scorePercent,
            final_score_percent: scorePercent,
            ai_feedback: feedback,
            ai_provider: aiProvider,
            ai_graded_at: aiProvider ? new Date().toISOString() : null
          }).eq('id', resp.id);
        }
      }

      if (hasManualReview) {
        await supabaseAdmin.from('assessment_attempts').update({
          status: 'submitted', // stays submitted until instructor grades
        }).eq('id', attemptId);
      } else {
        const scorePercent = (totalEarned / totalPossible) * 100;
        const isPassed = scorePercent >= (attempt.assessments.passing_score_percent || 70);
        
        await supabaseAdmin.from('assessment_attempts').update({
          status: 'graded',
          score_percent: scorePercent,
          passed: isPassed,
          graded_at: new Date().toISOString()
        }).eq('id', attemptId);
      }

      await supabaseAdmin.from('jobs').update({ status: 'completed' }).eq('id', job.id);
    } catch (error: any) {
      console.error("Job failed:", error);
      await supabaseAdmin.from('jobs').update({ status: 'failed', error: error.message }).eq('id', job.id);
    }
  }

  return NextResponse.json({ message: 'Processed jobs' });
}
