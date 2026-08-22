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

export async function setEnrollmentStatus(studentId: string, courseId: string, status: 'active' | 'banned') {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('enrollments')
    .update({ 
      status,
      banned_at: status === 'banned' ? new Date().toISOString() : null,
      banned_by: status === 'banned' ? user.id : null
    })
    .eq('student_id', studentId)
    .eq('course_id', courseId);

  if (error) {
    console.error("Failed to update enrollment status", error);
    return { success: false, error: "Failed to update status" };
  }

  revalidatePath('/admin/enrollments');
  return { success: true };
}

export async function setAccountStatus(studentId: string, status: 'active' | 'suspended') {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ 
      status,
      suspended_at: status === 'suspended' ? new Date().toISOString() : null,
      suspended_by: status === 'suspended' ? user.id : null
    })
    .eq('id', studentId);

  if (error) {
    console.error("Failed to update account status", error);
    return { success: false, error: "Failed to update account status" };
  }

  revalidatePath('/admin/enrollments');
  return { success: true };
}
