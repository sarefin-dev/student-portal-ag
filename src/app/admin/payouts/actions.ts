'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function generatePayoutsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data, error } = await supabase.rpc('generate_instructor_payouts');
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/payouts');
  return { success: true, count: data };
}

export async function markAsPaidAction(formData: FormData) {
  const payoutId = formData.get('payout_id') as string;
  const method = formData.get('method') as string;
  const trxId = formData.get('trx_id') as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.rpc('mark_payout_as_paid', {
    p_payout_id: payoutId,
    p_admin_id: user.id,
    p_method: method,
    p_trx: trxId || null
  });

  if (error) return { error: error.message };
  
  revalidatePath('/admin/payouts');
  revalidatePath('/admin/ledger');
  return { success: true };
}
