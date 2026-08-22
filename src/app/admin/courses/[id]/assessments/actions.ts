'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteAssessment(formData: FormData) {
  const courseId = formData.get('courseId') as string;
  const assessmentId = formData.get('assessmentId') as string;
  
  const supabase = await createClient();
  const { error } = await supabase.from('assessments').delete().eq('id', assessmentId);
  
  if (error) {
    console.error("Error deleting assessment:", error);
    throw new Error('Failed to delete assessment');
  }

  revalidatePath(`/admin/courses/${courseId}/assessments`);
}

export async function createAssessment(formData: FormData) {
  const courseId = formData.get('courseId') as string;
  const title = formData.get('title') as string;
  const instructions = formData.get('instructions') as string;
  const targetId = formData.get('targetId') as string; // format: "lesson|uuid" or "module|uuid"
  const isRequired = formData.get('isRequired') === 'true';

  if (!targetId || !targetId.includes('|')) {
    throw new Error("Invalid attachment target");
  }

  const [type, id] = targetId.split('|');
  const payload: any = {
    title,
    instructions,
    is_required: isRequired
  };

  if (type === 'lesson') {
    payload.lesson_id = id;
  } else if (type === 'module') {
    payload.module_id = id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('assessments').insert(payload).select('id').single();

  if (error || !data) {
    console.error("Error creating assessment:", error);
    throw new Error('Failed to create assessment');
  }

  revalidatePath(`/admin/courses/${courseId}/assessments`);
  redirect(`/admin/courses/${courseId}/assessments/${data.id}`);
}

export async function addQuestion(formData: FormData) {
  const assessmentId = formData.get('assessmentId') as string;
  const questionType = formData.get('questionType') as 'mcq' | 'short_answer';
  const prompt = formData.get('prompt') as string;
  const position = parseInt(formData.get('position') as string);
  
  const payload: any = {
    assessment_id: assessmentId,
    question_type: questionType,
    prompt,
    position,
    points: 1
  };

  if (questionType === 'mcq') {
    const correctOption = formData.get('correctOption') as string;
    payload.correct_option_id = correctOption;
    payload.options = [
      { id: 'a', text: formData.get('optA') as string },
      { id: 'b', text: formData.get('optB') as string },
      { id: 'c', text: formData.get('optC') as string },
      { id: 'd', text: formData.get('optD') as string }
    ];
  } else {
    payload.grading_rubric_hint = formData.get('rubric') as string;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('assessment_questions').insert(payload);

  if (error) {
    console.error("Error adding question:", error);
    throw new Error('Failed to add question');
  }

  revalidatePath(`/admin/courses/x/assessments/${assessmentId}`, 'page');
}

export async function deleteQuestion(formData: FormData) {
  const questionId = formData.get('questionId') as string;
  
  const supabase = await createClient();
  const { error } = await supabase.from('assessment_questions').delete().eq('id', questionId);
  
  if (error) {
    console.error("Error deleting question:", error);
    throw new Error('Failed to delete question');
  }
  
  // Need to find a way to revalidate the path, or just let next/navigation handle it via client refresh
  // Revalidate entire path space since we don't have courseId here easily
  revalidatePath('/admin/courses', 'layout');
}
