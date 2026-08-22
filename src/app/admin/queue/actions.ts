'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') throw new Error('Forbidden');
  return supabase;
}

export async function approvePendingVerification(formData: FormData) {
  const pendingId = formData.get('pendingId') as string;
  const receivedTxId = formData.get('receivedTxId') as string; // Optional, if they match it manually
  const supabase = await requireAdmin();

  // Call the atomic manual override RPC
  const { error } = await supabase.rpc('force_approve_pending_verification', { 
    p_pending_id: pendingId, 
    p_received_tx_id: receivedTxId || null 
  });

  if (error) {
    console.error("Manual approval failed:", error);
    throw new Error('Failed to approve payment');
  }
  
  revalidatePath('/admin/queue');
}

export async function rejectPendingVerification(formData: FormData) {
  const pendingId = formData.get('pendingId') as string;
  const reason = formData.get('reason') as string || 'Declined by admin';
  const supabase = await requireAdmin();

  await supabase
    .from('pending_verifications')
    .update({ status: 'rejected' })
    .eq('id', pendingId);

  // Todo: Send rejection email with reason using Resend
  console.log(`Rejected ${pendingId} for reason: ${reason}`);

  revalidatePath('/admin/queue');
}
