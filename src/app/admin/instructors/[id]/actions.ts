'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { env } from '@/env';

export async function updatePayoutPercentage(instructorId: string, percentage: number) {
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

  if (percentage < 0 || percentage > 100) {
    return { error: 'Percentage must be between 0 and 100.' };
  }

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ payout_percentage: percentage })
    .eq('id', instructorId);

  if (error) {
    console.error("Error updating payout percentage:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/instructors/${instructorId}`);
  revalidatePath(`/admin/instructors`);
  
  return { success: true };
}
