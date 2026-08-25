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

export async function updateKysAction(instructorId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && user.id !== instructorId) {
    return { error: 'Unauthorized: Admin or self access required' };
  }

  const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const updates = {
    phone: formData.get('phone') as string,
    avatar_url: formData.get('avatar_url') as string,
    address: formData.get('address') as string,
    bio: formData.get('bio') as string,
    nid_number: formData.get('nid_number') as string,
    expertise: formData.get('expertise') as string,
    interests: formData.get('interests') as string,
    social_fb: formData.get('social_fb') as string,
    social_x: formData.get('social_x') as string,
    social_linkedin: formData.get('social_linkedin') as string,
    social_github: formData.get('social_github') as string,
  };

  const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', instructorId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/instructors/${instructorId}`);
  return { success: true };
}

