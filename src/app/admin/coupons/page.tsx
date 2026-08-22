import { createClient } from '@/lib/supabase/server';
import { CouponManager } from './coupon-manager';

export default async function AdminCouponsPage() {
  const supabase = await createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Coupons & Promos</h1>
        <p className="text-muted-foreground">Manage discount codes and promotional campaigns.</p>
      </div>

      <CouponManager coupons={coupons || []} />
    </div>
  );
}
