'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { env } from '@/env';

export async function toggleStudentStatus(studentId: string, currentStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      status: newStatus,
      suspended_at: newStatus === 'suspended' ? new Date().toISOString() : null,
      suspended_by: newStatus === 'suspended' ? user.id : null,
    })
    .eq('id', studentId);

  if (error) {
    console.error('Error toggling student status:', error);
    throw new Error('Failed to update student status');
  }

  revalidatePath('/admin/students');
}



export async function createStudentAdmin(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error('Unauthorized');

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone: phone || null
    }
  });

  if (authError) {
    return { error: authError.message };
  }

  revalidatePath('/admin/students');
  return { success: true };
}

import { Resend } from 'resend';

export async function sendStudentNotification(studentId: string, title: string, body: string, sendEmail: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Unauthorized: Admin access required' };

    if (!title || !body) {
      return { error: 'Title and message body are required' };
    }

    // Insert in-app Notification
    const supabaseAdmin = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: notifError } = await supabaseAdmin.from('notifications').insert({
      user_id: studentId,
      type: 'admin_message',
      title,
      body
    });

    if (notifError) {
      console.error('Notification insertion error:', notifError);
      return { error: 'Failed to create in-app notification: ' + notifError.message };
    }

    let emailWarning: string | undefined;

    if (sendEmail) {
      if (!env.RESEND_API_KEY) {
        emailWarning = 'In-app notification delivered, but RESEND_API_KEY is not configured for email delivery.';
      } else {
        try {
          const resend = new Resend(env.RESEND_API_KEY);
          const { data: student } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', studentId).single();
          if (student && student.email) {
            const { error: resendError } = await resend.emails.send({
              from: 'ArefinLab <noreply@arefinlab.com>',
              to: student.email,
              subject: title,
              text: body
            });
            if (resendError) {
              console.error('Resend delivery error:', resendError);
              emailWarning = `Notification saved, but email delivery failed: ${resendError.message}`;
            }
          }
        } catch (mailErr: any) {
          console.error('Resend exception:', mailErr);
          emailWarning = `Notification saved, but email could not be sent: ${mailErr?.message || 'Network error'}`;
        }
      }
    }

    return { 
      success: true, 
      warning: emailWarning 
    };
  } catch (err: any) {
    console.error('sendStudentNotification fatal error:', err);
    return { error: err.message || 'Failed to send notification' };
  }
}
