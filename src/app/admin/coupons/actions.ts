'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function createCoupon(formData: FormData) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const code = formData.get('code') as string;
  const discountType = formData.get('discount_type') as 'percent' | 'fixed';
  const discountValue = parseFloat(formData.get('discount_value') as string);
  const maxRedemptions = formData.get('max_redemptions') ? parseInt(formData.get('max_redemptions') as string, 10) : null;
  const expiresAt = formData.get('expires_at') ? new Date(formData.get('expires_at') as string).toISOString() : null;

  if (!code || !discountType || isNaN(discountValue)) {
    return { success: false, error: "Missing required fields" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('coupons')
    .insert({
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      max_redemptions: maxRedemptions,
      expires_at: expiresAt
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: "Coupon code already exists" };
    return { success: false, error: "Failed to create coupon" };
  }

  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function deleteCoupon(id: string) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('coupons')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: "Failed to delete coupon" };

  revalidatePath('/admin/coupons');
  return { success: true };
}
