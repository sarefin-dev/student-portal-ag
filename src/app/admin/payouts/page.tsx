import { createClient } from '@/lib/supabase/server';
import { PayoutsClient } from './payouts-client';

export default async function AdminPayoutsPage() {
  const supabase = await createClient();

  const { data: payouts } = await supabase
    .from('instructor_payouts')
    .select(`
      *,
      profiles (
        full_name,
        email,
        payout_method,
        payout_bkash,
        payout_nagad,
        payout_bank
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Payouts</h1>
          <p className="text-muted-foreground mt-2">Manage revenue share payouts to instructors.</p>
        </div>
      </div>
      <PayoutsClient payouts={payouts || []} />
    </div>
  );
}
