'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { env } from '@/env';

export async function toggleStaffStatus(staffId: string, currentStatus: string) {
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
    .eq('id', staffId);

  if (error) {
    console.error('Error toggling staff status:', error);
    throw new Error('Failed to update status');
  }

  revalidatePath('/admin/instructors');
}

export async function createStaff(formData: FormData) {
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

  const email = formData.get('email') as string;
  const fullName = formData.get('full_name') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Create auth user
  const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) {
    throw new Error(authError.message);
  }

  // 2. Update their role in profiles (the trigger already created the profile row with role='student')
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', newAuthUser.user.id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath('/admin/instructors');
}
