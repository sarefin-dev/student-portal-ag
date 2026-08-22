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

export async function createBundle(title: string, description: string, priceAmount: number, availableFrom: string | null, availableUntil: string | null, courseIds: string[]) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  
  // Create bundle
  const { data: bundle, error: bundleError } = await supabase
    .from('bundles')
    .insert({
      title,
      description,
      price_amount: priceAmount,
      available_from: availableFrom || null,
      available_until: availableUntil || null
    })
    .select('id')
    .single();

  if (bundleError || !bundle) {
    return { success: false, error: "Failed to create bundle" };
  }

  // Add items
  if (courseIds.length > 0) {
    const items = courseIds.map(courseId => ({
      bundle_id: bundle.id,
      course_id: courseId
    }));
    
    const { error: itemsError } = await supabase.from('bundle_items').insert(items);
    if (itemsError) {
      return { success: false, error: "Failed to attach courses to bundle" };
    }
  }

  revalidatePath('/admin/bundles');
  return { success: true };
}

export async function deleteBundle(id: string) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('bundles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: "Failed to delete bundle" };

  revalidatePath('/admin/bundles');
  return { success: true };
}
