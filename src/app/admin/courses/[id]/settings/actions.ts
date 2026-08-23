'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCourseSettings(formData: FormData) {
  const courseId = formData.get('courseId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;
  const startDate = formData.get('start_date') as string;
  const cutoffDate = formData.get('enrollment_cutoff_date') as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const updatePayload: any = {
    title,
    description,
    thumbnail_url: thumbnailUrl || null
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

  revalidatePath(`/admin/courses/${courseId}/settings`);
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath('/admin/courses');
}
