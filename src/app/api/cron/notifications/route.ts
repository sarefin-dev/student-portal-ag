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
    .select('id, course_id, title, start_time, courses(title)')
    .gte('start_time', lowerBound)
    .lte('start_time', upperBound)
    .is('deleted_at', null);

  let notifiedCount = 0;

  if (sessions && sessions.length > 0) {
    for (const session of sessions) {
      // Find all enrolled students
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('student_id, profiles(email, full_name)')
        .eq('course_id', session.course_id)
        .eq('status', 'active');

      if (!enrollments) continue;

      for (const e of enrollments) {
        // Prevent duplicate notifications (we'd usually have a flag or rely on idempotency, but here we just check if it exists)
        const existingData = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('user_id', e.student_id)
          .eq('type', 'class_reminder')
          .eq('reference_id', session.id)
          .single();
        
        if (existingData.data) continue;

        // 1. Insert In-App Notification
        const message = `Reminder: "${session.title}" starts in 24 hours.`;
        await supabaseAdmin.from('notifications').insert({
          user_id: e.student_id,
          type: 'class_reminder',
          message: message,
          reference_id: session.id
        });

        const profile = e.profiles as any;
        const course = session.courses as any;

        // 2. Send Email
        if (resend && profile?.email) {
          try {
            await resend.emails.send({
              from: 'Student Portal <noreply@arefinlab.com>',
              to: [profile.email],
              subject: `Class Reminder: ${course.title}`,
              html: `<p>Hi ${profile.full_name},</p><p>This is a reminder that <strong>${session.title}</strong> is starting in 24 hours.</p><p>See you in class!</p>`
            });
            
            // Log the email
            await supabaseAdmin.from('email_log').insert({
              recipient_email: profile.email,
              subject: `Class Reminder: ${course.title}`,
              status: 'sent'
            });
          } catch (err) {
            console.error("Failed to send email", err);
          }
        }
        notifiedCount++;
      }
    }
  }

  return NextResponse.json({ success: true, notifiedCount });
}
