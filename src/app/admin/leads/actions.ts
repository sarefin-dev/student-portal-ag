'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createLead(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const source = formData.get('source') as string || 'Manual';
  const interested_in = formData.get('interested_in') as string;
  const notes = formData.get('notes') as string;

  const supabase = await createClient();
  const { error } = await supabase.from('leads').insert({
    name,
    email,
    phone,
    source,
    interested_in,
    notes
  });

  if (error) {
    console.error('Create lead error:', error);
    throw new Error('Failed to create lead');
  }

  revalidatePath('/admin/leads');
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('leads').update({ status }).eq('id', id);
  if (error) {
    console.error('Update lead status error:', error);
    throw new Error('Failed to update lead status');
  }
  revalidatePath('/admin/leads');
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) {
    console.error('Delete lead error:', error);
    throw new Error('Failed to delete lead');
  }
  revalidatePath('/admin/leads');
}

