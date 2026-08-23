'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const kind = formData.get('kind') as string;
  const price_amount = formData.get('price_amount') ? parseFloat(formData.get('price_amount') as string) : 0;
  const pricing_model = formData.get('pricing_model') as string;

  const supabase = await createClient();
  
  const { error } = await supabase.from('products').insert({
    title,
    slug,
    kind,
    price_amount,
    pricing_model
  });

  if (error) {
    console.error("Create product error:", error);
    throw new Error('Failed to create product');
  }

  revalidatePath('/admin/products');
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error('Failed to delete product');
  revalidatePath('/admin/products');
}
