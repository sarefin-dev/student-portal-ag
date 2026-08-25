'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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


export async function promoteLeadToStudent(leadId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Explicitly check if caller is an admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { success: false, error: 'Forbidden' };

  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return { success: false, error: 'Lead not found' };
  if (!lead.email) return { success: false, error: 'Lead must have an email address to create a student account' };

  const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Check if user already exists
  const { data: existingProfile, error: profileErr } = await supabaseAdmin.from('profiles').select('id').eq('email', lead.email).maybeSingle();
  
  if (existingProfile) {
    // Just mark lead as converted
    await supabase.from('leads').update({ status: 'converted' }).eq('id', leadId);
    revalidatePath('/admin/leads');
    return { success: true, message: 'Account already exists. Lead marked as converted.' };
  }

  // Create account via invite (auto-sends magic link)
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(lead.email, {
    data: { full_name: lead.name }
  });

  if (inviteError) {
    return { success: false, error: inviteError.message };
  }

  // Update lead status
  await supabase.from('leads').update({ status: 'converted' }).eq('id', leadId);
  
  revalidatePath('/admin/leads');
  return { success: true, message: 'Student account created and invite sent! Lead marked as converted.' };
}
