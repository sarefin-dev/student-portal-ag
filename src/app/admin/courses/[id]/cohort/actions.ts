'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { env } from '@/env';

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'instructor'].includes(profile.role)) return null;
  return user;
}

export async function forceCompleteCohortEnrollment(enrollmentId: string, courseId: string) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const supabaseAdmin = createAdminClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabaseAdmin.rpc('force_complete_cohort_enrollment', {
    p_enrollment_id: enrollmentId,
    p_admin_id: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/courses/${courseId}/cohort`);
  return { success: true };
}

export async function toggleInstructorControlledCompletion(courseId: string, value: boolean) {
  const user = await getAdminUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('courses')
    .update({ instructor_controlled_completion: value })
    .eq('id', courseId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/courses/${courseId}/cohort`);
  revalidatePath(`/admin/courses/${courseId}/settings`);
  return { success: true };
}
