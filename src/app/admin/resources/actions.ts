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
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as string;
  const isFree = formData.get('is_free') === 'true';
  const priceAmount = formData.get('price_amount') ? parseFloat(formData.get('price_amount') as string) : null;
  const watermarkEnabled = formData.get('watermark_enabled') === 'true';
  const downloadLimit = formData.get('download_limit') ? parseInt(formData.get('download_limit') as string, 10) : null;
  const file = formData.get('file') as File;

  if (!title || !type || !file) {
    return { success: false, error: "Missing required fields" };
  }
  if (!isFree && (!priceAmount || priceAmount <= 0)) {
    return { success: false, error: "Paid resources must have a price" };
  }

  const supabase = await createClient();
  
  // Upload to private_resources bucket
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('private_resources')
    .upload(fileName, file);

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { success: false, error: "Failed to upload file" };
  }

  const { error: insertError } = await supabase
    .from('resources')
    .insert({
      title,
      description,
      type,
      is_free: isFree,
      price_amount: isFree ? null : priceAmount,
      storage_path: fileName,
      watermark_enabled: watermarkEnabled,
      download_limit: downloadLimit,
    });

  if (insertError) {
    console.error("Database insert error:", insertError);
    return { success: false, error: "Failed to save resource record" };
  }

  revalidatePath('/admin/resources');
  return { success: true };
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
