'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCoupon, deleteCoupon } from './actions';
import { Ticket, Trash2, Calendar, Users } from 'lucide-react';
import { LocalTime } from '@/components/local-time';

export function CouponManager({ coupons }: { coupons: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await createCoupon(formData);
    setIsSubmitting(false);
    if (res.success) {
      e.currentTarget.reset();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-4">
        {coupons.map(coupon => (
          <Card key={coupon.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg uppercase tracking-wider">{coupon.code}</h3>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `${coupon.discount_value} BDT OFF`}
                  </span>
                </div>
                
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {coupon.redemption_count} {coupon.max_redemptions ? `/ ${coupon.max_redemptions} used` : 'used (Unlimited)'}
                  </div>
                  {coupon.expires_at && (
                    <div className="flex items-center gap-1 text-destructive">
                      <Calendar className="w-3 h-3" />
                      Expires: <LocalTime isoString={coupon.expires_at} />
                    </div>
                  )}
                </div>
              </div>
              
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                if (confirm("Are you sure?")) await deleteCoupon(coupon.id);
              }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {coupons.length === 0 && (
          <div className="text-center p-12 border rounded-lg bg-muted/30">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Coupons</h3>
            <p className="text-muted-foreground">Create discount codes for your students.</p>
          </div>
        )}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Create Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input name="code" required placeholder="e.g. SUMMER2024" className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <select name="discount_type" className="w-full p-2 border rounded-md bg-background text-sm" required>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (BDT)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input name="discount_value" type="number" step="0.01" min="1" required placeholder="e.g. 20" />
              </div>
              <div className="space-y-2">
                <Label>Max Redemptions (Optional)</Label>
                <Input name="max_redemptions" type="number" placeholder="e.g. 100 (Leave empty for unlimited)" />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Input name="expires_at" type="datetime-local" />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Coupon'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
