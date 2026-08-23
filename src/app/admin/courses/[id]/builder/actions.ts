'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateCourseCache } from '@/lib/redis/cache';
import { redirect } from 'next/navigation';

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function addModule(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const title = formData.get('title') as string || 'New Module';
  
  // Get current max position to append to the end
  const { data: existing } = await supabase
    .from('modules')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1);

  const newPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

  const { error } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      position: newPosition
    });

  if (error) console.error("Error adding module:", error);

  revalidatePath(`/admin/courses/${courseId}/builder`);
}

export async function addSubmodule(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const moduleId = formData.get('moduleId') as string;
  const title = formData.get('title') as string || 'New Submodule';

  const { data: existing } = await supabase
    .from('submodules')
    .select('position')
    .eq('module_id', moduleId)
    .order('position', { ascending: false })
    .limit(1);

  const newPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

  const { error } = await supabase
    .from('submodules')
    .insert({
      module_id: moduleId,
      title,
      position: newPosition
    });

  if (error) console.error("Error adding submodule:", error);

  revalidatePath(`/admin/courses/${courseId}/builder`);
}

export async function addLesson(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const submoduleId = formData.get('submoduleId') as string;
  const title = formData.get('title') as string || 'New Lesson';

  const { data: existing } = await supabase
    .from('lessons')
    .select('position')
    .eq('submodule_id', submoduleId)
    .order('position', { ascending: false })
    .limit(1);

  const newPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

  const { error } = await supabase
    .from('lessons')
    .insert({
      submodule_id: submoduleId,
      title,
      position: newPosition
    });

  if (error) console.error("Error adding lesson:", error);

  revalidatePath(`/admin/courses/${courseId}/builder`);
}

export async function publishCourse(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;

  const { data: course } = await supabase.from('courses').select('slug').eq('id', courseId).single();

  await supabase
    .from('courses')
    .update({ status: 'active' })
    .eq('id', courseId);

  if (course?.slug) await invalidateCourseCache(course.slug);
  
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath(`/courses`); // Public catalog
}

export async function setComingSoon(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;

  const { data: course } = await supabase.from('courses').select('slug').eq('id', courseId).single();

  await supabase
    .from('courses')
    .update({ status: 'coming_soon' })
    .eq('id', courseId);

  if (course?.slug) await invalidateCourseCache(course.slug);
  
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath(`/courses`); // Public catalog
}

export async function unpublishCourse(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;

  const { data: course } = await supabase.from('courses').select('slug').eq('id', courseId).single();

  await supabase
    .from('courses')
    .update({ status: 'draft' })
    .eq('id', courseId);

  if (course?.slug) await invalidateCourseCache(course.slug);

  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath(`/courses`); // Public catalog
}

export async function updatePrice(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const price_amount = parseFloat(formData.get('price_amount') as string);
  const compare_at_price_raw = formData.get('compare_at_price');
  const compare_at_price = compare_at_price_raw ? parseFloat(compare_at_price_raw as string) : null;

  const { data: course } = await supabase.from('courses').select('slug').eq('id', courseId).single();

  const { error } = await supabase
    .from('courses')
    .update({ price_amount, compare_at_price })
    .eq('id', courseId);

  if (error) throw new Error("Error updating price");
  
  if (course?.slug) await invalidateCourseCache(course.slug);
  revalidatePath(`/admin/courses/${courseId}/builder`);
}
