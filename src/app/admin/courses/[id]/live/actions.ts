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

  revalidatePath(`/admin/courses/${courseId}/live`);
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

  revalidatePath(`/admin/courses/${courseId}/live`);
  return { success: true };
}

export async function createRoutine(courseId: string, name: string) {
  const user = await verifyStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('routines')
    .insert({
      course_id: courseId,
      name
    });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/courses/${courseId}/live`);
  return { success: true };
}

export async function bulkGenerateLiveSessions(
  courseId: string,
  routineId: string,
  startDateStr: string, // '2026-03-01T20:00'
  daysOfWeek: number[], // [0, 3, 5] for Sun, Wed, Fri
  durationMinutes: number,
  totalClasses: number,
  meetingUrl: string
) {
  const user = await verifyStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  // Parse start date in local time
  let currentDate = new Date(startDateStr);
  const sessions = [];
  let classCount = 0;

  // Safety net to prevent infinite loops if daysOfWeek is empty
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return { success: false, error: "Must select at least one day of the week" };
  }

  while (classCount < totalClasses && sessions.length < 365) {
    // getDay() returns 0 (Sun) to 6 (Sat)
    if (daysOfWeek.includes(currentDate.getDay())) {
      classCount++;
      sessions.push({
        course_id: courseId,
        routine_id: routineId,
        title: `Class ${classCount}`,
        scheduled_at: currentDate.toISOString(),
        duration_minutes: durationMinutes,
        meeting_url: meetingUrl
      });
    }
    // Add 1 day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const supabase = await createClient();
  const { error } = await supabase.from('live_sessions').insert(sessions);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/courses/${courseId}/live`);
  return { success: true };
}
