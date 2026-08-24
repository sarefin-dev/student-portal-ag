'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function generateAiSummary(title: string, outcomes: string) {
  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Write a very concise, professional one-sentence summary (max 150 characters) of what was covered in this course for a certificate of completion. Start the sentence dynamically (e.g. "key concepts including...", "advanced topics such as...", or "practical skills in..."). Do not include the course name. 
      Course Title: ${title}
      Outcomes: ${outcomes}`,
    });
    return { summary: text.replace(/^["']|["']$/g, '').trim() };
  } catch (e) {
    console.error("AI Summary generation failed", e);
    return { error: 'Failed to generate summary' };
  }
}

export async function updateCourseSettings(formData: FormData) {
  const courseId = formData.get('courseId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;
  const startDate = formData.get('start_date') as string;
  const cutoffDate = formData.get('enrollment_cutoff_date') as string;
  const outcomesText = formData.get('outcomes') as string;
  const aiSummary = formData.get('ai_summary') as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const updatePayload: any = {
    title,
    description,
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

  const { error } = await supabase
    .from('courses')
    .update(updatePayload)
    .eq('id', courseId);

  if (error) {
    console.error("Error updating course settings:", error);
    throw new Error('Failed to update course settings');
  }

  revalidatePath(`/instructor/courses/${courseId}/settings`);
  revalidatePath(`/instructor/courses/${courseId}/builder`);
  revalidatePath('/instructor/courses');
}
