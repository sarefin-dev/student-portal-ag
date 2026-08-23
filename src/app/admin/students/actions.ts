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
