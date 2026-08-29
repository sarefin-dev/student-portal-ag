'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateText } from 'ai';
import { getCloudAI, getAllConfiguredModels } from '@/lib/ai/openrouter';

const AI_SUMMARY_PROMPT = (title: string, outcomes: string) =>
  `Write a very concise, professional one-sentence summary (max 150 characters) of what was covered in this course for a certificate of completion. Start the sentence dynamically (e.g. "key concepts including...", "advanced topics such as...", or "practical skills in..."). Do not include the course name.
Course Title: ${title}
Outcomes: ${outcomes}`;

export async function generateAiSummary(title: string, outcomes: string) {
  try {
    const cloudAI = await getCloudAI();
    const models = getAllConfiguredModels();
    let text = '';
    let lastError: unknown;

    for (const modelName of models) {
      try {
        const result = await generateText({
          model: cloudAI(modelName),
          prompt: AI_SUMMARY_PROMPT(title, outcomes),
        });
        text = result.text;
        break;
      } catch (err) {
        console.warn(`AI summary: model ${modelName} failed, trying next`, err);
        lastError = err;
      }
    }

    if (!text) throw lastError ?? new Error('All models failed');
    return { summary: text.replace(/^["']|["']$/g, '').trim() };
  } catch (e) {
    console.error('AI Summary generation failed', e);
    return { error: 'Failed to generate summary. Please try again.' };
  }
}

export async function updateCourseSettings(formData: FormData) {
  const courseId = formData.get('courseId') as string;
  const title = formData.get('title') as string;
  const type = formData.get('type') as string;
  const description = formData.get('description') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;
  const duration = formData.get('duration') as string;
  const startDate = formData.get('start_date') as string;
  const cutoffDate = formData.get('enrollment_cutoff_date') as string;
  const outcomesText = formData.get('outcomes') as string;
  const aiSummary = formData.get('ai_summary') as string;
  const instructorId = formData.get('instructorId') as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const updatePayload: any = {
    title,
    type,
    description,
    duration: duration || null,
    thumbnail_url: thumbnailUrl || null,
    outcomes: outcomesText ? outcomesText.split('\n').filter(s => s.trim()) : [],
    ai_summary: aiSummary || null
  };

  if (startDate !== null && startDate !== undefined) {
    updatePayload.start_date = startDate ? new Date(startDate).toISOString() : null;
  }
  if (cutoffDate !== null && cutoffDate !== undefined) {
    updatePayload.enrollment_cutoff_date = cutoffDate ? new Date(cutoffDate).toISOString() : null;
  }

  // 1. Update Course Table
  const { error } = await supabase
    .from('courses')
    .update(updatePayload)
    .eq('id', courseId);

  if (error) {
    console.error("Error updating course settings:", error);
    throw new Error('Failed to update course settings');
  }

  // 2. Update Instructor Assignment
  if (instructorId) {
    // 1. Reset all existing instructors to NOT be the lead
    await supabase.from('instructor_assignments').update({ is_lead: false }).eq('course_id', courseId);
    
    // 2. Upsert the selected instructor as the lead (keeps them as co-instructor if they were already one)
    const { error: assignError } = await supabase
      .from('instructor_assignments')
      .upsert({ 
        course_id: courseId, 
        instructor_id: instructorId,
        is_lead: true
      }, { onConflict: 'course_id, instructor_id' });
    
    if (assignError) console.error("Instructor assignment error:", assignError);
  } else {
    // Clear assignment if they set it back to "None"
    await supabase.from('instructor_assignments').delete().eq('course_id', courseId);
  }

  revalidatePath(`/admin/courses/${courseId}/settings`);
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath('/admin/courses');
}





