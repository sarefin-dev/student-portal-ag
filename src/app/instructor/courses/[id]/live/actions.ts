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

export async function createLiveSession(courseId: string, title: string, scheduledAt: string, duration: number, meetingUrl: string) {
  const user = await verifyStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .insert({
      course_id: courseId,
      title,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      meeting_url: meetingUrl
    });

  if (error) {
    console.error("Failed to create live session", error);
    return { success: false, error: "Failed to create session" };
  }

  revalidatePath(`/instructor/courses/${courseId}/live`);
  return { success: true };
}

export async function deleteLiveSession(courseId: string, sessionId: string) {
  const user = await verifyStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('course_id', courseId);

  if (error) {
    console.error("Failed to delete session", error);
    return { success: false, error: "Failed to delete session" };
  }

  revalidatePath(`/instructor/courses/${courseId}/live`);
  return { success: true };
}
