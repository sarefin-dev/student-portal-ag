'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function approveTestimonial(id: string) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('testimonials')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/testimonials');
  return { success: true };
}

export async function rejectTestimonial(id: string) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('testimonials')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/testimonials');
  return { success: true };
}
