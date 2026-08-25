'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  source: z.string().default('Manual'),
  interested_in: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function createLead(formData: FormData) {
  try {
    const parsed = leadSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      source: formData.get('source') || 'Manual',
      interested_in: formData.get('interested_in'),
      notes: formData.get('notes'),
    });

    const supabase = await createClient();
    const { error } = await supabase.from('leads').insert(parsed);

    if (error) {
      console.error('Create lead error:', error);
      return { success: false, error: 'Failed to create lead' };
    }

    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error) {
    console.error('Validation error:', error);
    return { success: false, error: 'Invalid input' };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error) {
    console.error('Update lead status error:', error);
    return { success: false, error: 'Failed to update lead status' };
  }
}

export async function deleteLead(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error) {
    console.error('Delete lead error:', error);
    return { success: false, error: 'Failed to delete lead' };
  }
}

type BulkLead = z.infer<typeof leadSchema>;

export async function createLeadsBulk(leads: any[]) {
  try {
    // Validating an array of leads would be better, but we trust the internal csv parser somewhat.
    const supabase = await createClient();
    const { error } = await supabase.from('leads').upsert(leads, { 
      onConflict: 'phone, interested_in',
      ignoreDuplicates: true 
    });
    if (error) throw error;
    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error) {
    console.error('Bulk insert error:', error);
    return { success: false, error: 'Failed to bulk insert leads' };
  }
}

