'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function manualEnroll(formData: FormData) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const email = formData.get('email') as string;
  const courseId = formData.get('courseId') as string;

  if (!email || !courseId) return { success: false, error: "Missing required fields" };

  const supabase = await createClient();

  // Find student
  const { data: student } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (!student) {
    return { success: false, error: "Student not found with this email" };
  }

  // Insert enrollment
  const { error } = await supabase
    .from('enrollments')
    .insert({
      student_id: student.id,
      course_id: courseId,
      source: 'admin',
      status: 'active'
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: "Student is already enrolled in this course" };
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/enroll-manual');
  revalidatePath('/admin/enrollments');
  return { success: true };
}
