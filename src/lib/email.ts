import { Resend } from 'resend';
import { env } from '@/env';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Send account creation welcome email with login credentials
 */
export async function sendWelcomeCredentialsEmail({
  to,
  fullName,
  password,
}: {
  to: string;
  fullName: string;
  password?: string;
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Skipping welcome email.');
    return { success: false, warning: 'Email service not configured.' };
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL || 'https://arefinlab.com';
  const loginUrl = `${appUrl}/login`;

  try {
    const { error } = await resend.emails.send({
      from: 'ArefinLab <noreply@arefinlab.com>',
      to,
      subject: 'Welcome to ArefinLab - Your Student Account Details',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
          <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">ArefinLab</h1>
          </div>
          
          <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Welcome, ${fullName}!</h2>
          <p style="color: #475569; font-size: 15px;">Your student account has been created on the ArefinLab Student Portal. You can now log in to access your enrolled courses, live cohort schedules, and learning materials.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-top: 0; margin-bottom: 12px;">Your Login Credentials</h3>
            <p style="margin: 6px 0; font-size: 15px;"><strong>Email:</strong> <span style="font-family: monospace; color: #0f172a;">${to}</span></p>
            ${password ? `<p style="margin: 6px 0; font-size: 15px;"><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #0f172a;">${password}</span></p>` : ''}
            <p style="margin-top: 12px; font-size: 13px; color: #94a3b8;">You can change your password anytime from your Account Settings.</p>
          </div>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">Log In to Student Portal</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">If you have any questions or need assistance, feel free to reach out to us.</p>
          
          <div style="border-top: 1px solid #f1f5f9; margin-top: 36px; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            © ${new Date().getFullYear()} ArefinLab. All rights reserved.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Welcome email sending error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Welcome email exception:', err);
    return { success: false, error: err?.message || 'Failed to send welcome email' };
  }
}

/**
 * Send course enrollment email and create in-app notification
 */
export async function sendEnrollmentNotification({
  studentId,
  studentEmail,
  studentName,
  courseTitle,
  courseSlug,
}: {
  studentId: string;
  studentEmail: string;
  studentName?: string;
  courseTitle: string;
  courseSlug?: string;
}) {
  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Create in-app notification
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: studentId,
      type: 'course_enrolled',
      title: `Enrolled in ${courseTitle}`,
      body: `You now have full access to ${courseTitle}. Click here to start learning!`,
    });
  } catch (err) {
    console.error('Failed to create in-app notification for enrollment:', err);
  }

  // 2. Send email via Resend
  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Skipping enrollment email.');
    return { success: true, emailSent: false };
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL || 'https://arefinlab.com';
  const learnUrl = courseSlug ? `${appUrl}/learn/${courseSlug}` : `${appUrl}/dashboard`;

  try {
    const { error } = await resend.emails.send({
      from: 'ArefinLab <noreply@arefinlab.com>',
      to: studentEmail,
      subject: `You're enrolled in ${courseTitle}!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
          <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">ArefinLab</h1>
          </div>
          
          <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Congratulations ${studentName || ''}!</h2>
          <p style="color: #475569; font-size: 15px;">You have been successfully enrolled in <strong>${courseTitle}</strong>. Your dashboard and all course materials are now unlocked.</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="font-size: 16px; font-weight: 600; color: #166534; margin-top: 0; margin-bottom: 6px;">${courseTitle}</h3>
            <p style="margin: 0; font-size: 14px; color: #15803d;">Status: <strong>Active Enrollment</strong></p>
          </div>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${learnUrl}" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">Start Learning Now</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">Visit your dashboard at any time to check routine times, attend live sessions, and track your lesson progress.</p>
          
          <div style="border-top: 1px solid #f1f5f9; margin-top: 36px; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            © ${new Date().getFullYear()} ArefinLab. All rights reserved.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Enrollment email error:', error);
      return { success: true, emailSent: false, error: error.message };
    }

    return { success: true, emailSent: true };
  } catch (err: any) {
    console.error('Enrollment email exception:', err);
    return { success: true, emailSent: false, error: err?.message };
  }
}
