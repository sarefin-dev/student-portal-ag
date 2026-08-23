import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { LedgerTable } from './ledger-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { env } from '@/env';

async function manualEnroll(formData: FormData) {
  'use server';
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

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const email = formData.get('email') as string;
  const courseId = formData.get('courseId') as string;
  const amount = formData.get('amount') as string;
  const trxId = formData.get('trxId') as string;
  const paymentDate = formData.get('payment_date') as string;

  // 1. Find user by email (using Admin because profiles are private)
  const { data: targetUser } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!targetUser) throw new Error('User not found with that email');

  // Call the atomic manual enrollment RPC
  const { error } = await supabaseAdmin.rpc('force_manual_enrollment', {
    p_student_id: targetUser.id,
    p_course_id: courseId,
    p_amount: parseFloat(amount),
    p_trx_id: trxId || `MANUAL-${Date.now()}`,
    p_admin_id: user.id,
    p_payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString()
  });

  if (error) {
    console.error("Manual enrollment failed:", error);
    throw new Error('Failed to record manual enrollment');
  }

  revalidatePath('/admin/ledger');
  redirect('/admin/ledger?success=true');
}

export default async function ManualLedgerPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  const supabase = await createClient();

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Ensure admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .order('created_at', { ascending: false });

  // Fetch all payments for ledger, using admin to bypass RLS for joins easily
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('*, orders(profiles(email))')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Ledger</h1>
          <p className="text-muted-foreground">View all transactions and record manual entries.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>Record Manual Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Manual Payment & Enroll</DialogTitle>
            </DialogHeader>
            <form action={manualEnroll} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student Email</label>
                <input required name="email" type="email" placeholder="student@example.com" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
                <p className="text-xs text-muted-foreground">User must have already created an account.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <select required name="courseId" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select a course...</option>
                  {courses?.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Paid (Tk)</label>
                <input required name="amount" type="number" step="0.01" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction ID (Optional)</label>
                <input name="trxId" placeholder="e.g. Bank Ref" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Actual Payment Date</label>
                <input name="payment_date" type="datetime-local" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
                <p className="text-xs text-muted-foreground">Leave blank to use current time.</p>
              </div>

              <Button type="submit" className="w-full">Record & Enroll</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <div className="bg-success/10 text-success p-4 rounded border border-success/20">
          Successfully recorded payment and enrolled the student!
        </div>
      )}

      <LedgerTable data={payments || []} />
    </div>
  );
}
