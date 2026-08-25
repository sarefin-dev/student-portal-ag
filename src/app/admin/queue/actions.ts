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
  try {
    const pendingId = formData.get('pendingId') as string;
    const receivedTxId = formData.get('receivedTxId') as string; // Optional, if they match it manually
    const createInstallment = formData.get('createInstallment') === 'true';
    const dueDays = parseInt(formData.get('dueDays') as string || '30', 10);
    
    const supabase = await requireAdmin();

    // Call the atomic manual override RPC
    const { error } = await supabase.rpc('force_approve_pending_verification', { 
      p_pending_id: pendingId, 
      p_received_tx_id: receivedTxId || null,
      p_create_installment: createInstallment,
      p_due_days: dueDays
    });

    if (error) {
      console.error("Manual approval failed:", error);
      return { success: false, error: 'Failed to approve payment: ' + error.message };
    }
    
    revalidatePath('/admin/queue');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' };
  }
}

export async function rejectPendingVerification(formData: FormData) {
  try {
    const pendingId = formData.get('pendingId') as string;
    const reason = formData.get('reason') as string || 'Declined by admin';
    const supabase = await requireAdmin();

    const { error } = await supabase
      .from('pending_verifications')
      .update({ status: 'rejected' })
      .eq('id', pendingId);

    if (error) {
      return { success: false, error: 'Failed to reject: ' + error.message };
    }

    // Todo: Send rejection email with reason using Resend
    console.log(`Rejected ${pendingId} for reason: ${reason}`);

    revalidatePath('/admin/queue');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' };
  }
}
