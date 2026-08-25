import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { Resend } from 'resend';

export async function POST(req: Request) {
  // Simple auth check if called by pg_cron (e.g. using a secret header)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

  // Class Reminders: Find live sessions starting in the next 24h that haven't been reminded yet
  // We'll look for sessions between 23h and 24h from now.
  const now = new Date();
  const lowerBound = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const upperBound = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions } = await supabaseAdmin
    .from('live_sessions')
    .select('id, course_id, title, scheduled_at, courses(title)')
    .gte('scheduled_at', lowerBound)
    .lte('scheduled_at', upperBound)
    .is('deleted_at', null);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: true, notifiedCount: 0 });
  }

  const courseIds = sessions.map(s => s.course_id);
  const sessionIds = sessions.map(s => s.id);

  // Bulk fetch enrollments for all relevant courses
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('student_id, course_id, profiles(email, full_name)')
    .in('course_id', courseIds)
    .eq('status', 'active');

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ success: true, notifiedCount: 0 });
  }

  // Bulk fetch existing notifications to prevent duplicates
  const { data: existingNotifications } = await supabaseAdmin
    .from('notifications')
    .select('user_id, reference_id')
    .eq('type', 'class_reminder')
    .in('reference_id', sessionIds);

  const existingSet = new Set(
    (existingNotifications || []).map(n => `${n.user_id}-${n.reference_id}`)
  );

  const notificationsToInsert: any[] = [];
  const emailsToSend: any[] = [];
  const emailLogsToInsert: any[] = [];

  for (const session of sessions) {
    const sessionEnrollments = enrollments.filter(e => e.course_id === session.course_id);
    const courseTitle = (session.courses as any)?.title || 'Course';

    for (const e of sessionEnrollments) {
      if (existingSet.has(`${e.student_id}-${session.id}`)) continue;

      const profile = e.profiles as any;
      if (!profile) continue;

      notificationsToInsert.push({
        user_id: e.student_id,
        type: 'class_reminder',
        message: `Reminder: "${session.title}" starts in 24 hours.`,
        reference_id: session.id
      });

      if (resend && profile.email) {
        emailsToSend.push({
          from: 'Student Portal <noreply@arefinlab.com>',
          to: [profile.email],
          subject: `Class Reminder: ${courseTitle}`,
          html: `<p>Hi ${profile.full_name},</p><p>This is a reminder that <strong>${session.title}</strong> is starting in 24 hours.</p><p>See you in class!</p>`
        });

        emailLogsToInsert.push({
          recipient_email: profile.email,
          subject: `Class Reminder: ${courseTitle}`,
          status: 'sent'
        });
      }
    }
  }

  if (notificationsToInsert.length > 0) {
    // Upsert in batches of 1000 if necessary, but typically a single insert is fine
    await supabaseAdmin.from('notifications').insert(notificationsToInsert);
  }

  if (emailsToSend.length > 0 && resend) {
    // Resend allows batch sending (up to 100 emails per request)
    // We chunk the array into sizes of 100
    const chunkSize = 100;
    for (let i = 0; i < emailsToSend.length; i += chunkSize) {
      const chunk = emailsToSend.slice(i, i + chunkSize);
      try {
        await resend.batch.send(chunk);
      } catch (err) {
        console.error("Failed to send email batch", err);
      }
    }

    await supabaseAdmin.from('email_log').insert(emailLogsToInsert);
  }

  return NextResponse.json({ success: true, notifiedCount: notificationsToInsert.length });
}
