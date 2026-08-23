'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function joinWaitlist(formData: FormData) {
  const courseId = formData.get('courseId') as string;
  const email = formData.get('email') as string;
  const slug = formData.get('slug') as string;

  if (!courseId || !email) {
    throw new Error('Email is required');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('course_waitlists')
    .insert({ course_id: courseId, email });

  // Ignore unique constraint violation (they are already on the list)
  if (error && error.code !== '23505') {
    console.error("Error joining waitlist:", error);
    throw new Error('Failed to join waitlist. Please try again.');
  }

  revalidatePath(`/courses/${slug}`);
  return { success: true };
}
