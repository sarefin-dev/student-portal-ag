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

export async function createResource(formData: FormData) {
  try {
    const user = await verifyAdmin();
    if (!user) return { success: false, error: "Unauthorized" };

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const isFree = formData.get('is_free') === 'true';
    const priceAmount = formData.get('price_amount') ? parseFloat(formData.get('price_amount') as string) : null;
    const compareAtPriceRaw = formData.get('compare_at_price');
    const compareAtPrice = compareAtPriceRaw ? parseFloat(compareAtPriceRaw as string) : null;
    const watermarkEnabled = formData.get('watermark_enabled') === 'true';
    const downloadLimit = formData.get('download_limit') ? parseInt(formData.get('download_limit') as string, 10) : null;
    const file = formData.get('file') as File | null;

    if (!title || !type || !file || file.size === 0) {
      return { success: false, error: "Missing required fields or file" };
    }
    if (!isFree && (!priceAmount || priceAmount <= 0)) {
      return { success: false, error: "Paid resources must have a price" };
    }

    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Upload to private_resources bucket using Buffer
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { error: uploadError } = await adminSupabase.storage
      .from('private_resources')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: "Failed to upload file: " + uploadError.message };
    }

    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from('resources')
      .insert({
        title,
        description,
        type,
        is_free: isFree,
        price_amount: isFree ? null : priceAmount,
        compare_at_price: isFree ? null : compareAtPrice,
        storage_path: fileName,
        watermark_enabled: watermarkEnabled,
        download_limit: downloadLimit,
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      return { success: false, error: "Failed to save resource record: " + insertError.message };
    }

    revalidatePath('/admin/resources');
    return { success: true };
  } catch (err: any) {
    console.error("createResource fatal error:", err);
    return { success: false, error: err?.message || "Failed to process upload" };
  }
}

export async function deleteResource(id: string) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from('resources')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, error: "Failed to delete resource" };
  }

  revalidatePath('/admin/resources');
  return { success: true };
}
