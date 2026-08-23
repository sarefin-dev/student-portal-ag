'use server';

import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { env } from '@/env';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// The student submits the quiz, we insert the attempt and queue the grading job.
export async function submitAssessment(assessmentId: string, courseId: string, answers: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Verify true course ID of the assessment
  const { data: trueCourseId } = await supabaseAdmin.rpc('assessment_course_id', { p_assessment_id: assessmentId });
  if (!trueCourseId || trueCourseId !== courseId) {
    throw new Error("Assessment does not belong to this course");
  }

  // Check enrollment manually using authenticated client (RLS enforced)
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status')
    .eq('course_id', trueCourseId)
    .eq('student_id', user.id)
    .single();

  if (enrollment?.status !== 'active') {
    throw new Error("You must be actively enrolled in this course to submit an assessment.");
  }

  // Fetch assessment and questions
  const { data: assessment } = await supabaseAdmin
    .from('assessments')
    .select('*, assessment_questions(*)')
    .eq('id', assessmentId)
    .single();

  if (!assessment) throw new Error("Assessment not found");

  // Determine the attempt number
  const { count } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('assessment_id', assessmentId)
    .eq('student_id', user.id);

  const attemptNumber = (count || 0) + 1;

  // 1. Record Attempt as 'submitted'
  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      student_id: user.id,
      attempt_number: attemptNumber,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (!attempt) throw new Error("Failed to record attempt");

  // 2. Insert Responses
  if (assessment.assessment_questions.length > 0) {
    const responsesPayload = assessment.assessment_questions.map((q: any) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      student_answer: q.question_type === 'mcq' 
        ? { selected_option_id: answers[q.id] || null }
        : { text: answers[q.id] || "" }
    }));
    
    await supabaseAdmin.from('question_responses').insert(responsesPayload);
  }

  // 3. Queue the grading job for the backend to process asynchronously
  await supabaseAdmin.from('jobs').insert({
    job_type: 'grade_assessment',
    payload: { attempt_id: attempt.id }
  });

  return {
    status: 'needs_review',
    score: null,
    feedback: "Your assessment has been submitted for grading."
  };
}
