'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'instructor') return null;
  return user;
}

export async function markAttendance(sessionId: string, courseId: string, studentId: string, present: boolean) {
  const user = await verifyStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('attendance')
    .upsert({
      live_session_id: sessionId,
      student_id: studentId,
      present,
      marked_by: user.id,
      marked_at: new Date().toISOString()
    }, { onConflict: 'live_session_id,student_id' });

  if (error) {
    console.error("Failed to mark attendance", error);
    return { success: false, error: "Failed to mark attendance" };
  }

  revalidatePath(`/instructor/courses/${courseId}/live/${sessionId}`);
  return { success: true };
}
