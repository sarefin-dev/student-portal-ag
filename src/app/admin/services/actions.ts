'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createService(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const slug = formData.get('slug') as string;
  const service_type = formData.get('service_type') as string;
  const delivery_format = formData.get('delivery_format') as string;
  const duration_minutes = formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null;
  const sessions_count = formData.get('sessions_count') ? parseInt(formData.get('sessions_count') as string) : 1;
  const turnaround_days = formData.get('turnaround_days') ? parseInt(formData.get('turnaround_days') as string) : null;

  const supabase = await createClient();
  
  const { error } = await supabase.from('services').insert({
    title,
    description,
    slug,
    service_type,
    delivery_format,
    duration_minutes,
    sessions_count,
    turnaround_days
  });

  if (error) {
    console.error("Create service error:", error);
    throw new Error('Failed to create service');
  }

  revalidatePath('/admin/services');
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error('Failed to delete service');
  revalidatePath('/admin/services');
}
