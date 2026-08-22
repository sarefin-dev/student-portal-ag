'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitTestimonial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Unauthorized" };

  const content = formData.get('content') as string;
  const rating = parseInt(formData.get('rating') as string, 10);
  const courseId = formData.get('courseId') as string | null;

  if (!content || !rating) return { success: false, error: "Missing fields" };

  const { error } = await supabase
    .from('testimonials')
    .insert({
      student_id: user.id,
      content,
      rating,
      course_id: courseId || null,
      status: 'pending'
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/testimonials');
  return { success: true };
}
