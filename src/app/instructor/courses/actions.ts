'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const type = formData.get('type') as string;

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title,
      slug,
      type,
      created_by: user.id,
      status: 'draft', // All new courses start as draft
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating course:', error);
    redirect('/instructor/courses/new?error=' + encodeURIComponent(error.message));
  }

  redirect(`/instructor/courses/${data.id}/builder`);
}
