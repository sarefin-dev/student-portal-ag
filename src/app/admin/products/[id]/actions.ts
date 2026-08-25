'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProduct(formData: FormData) {
  const supabase = await createClient();
  
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const tagline = formData.get('tagline') as string;
  const price_amount = formData.get('price_amount') ? parseFloat(formData.get('price_amount') as string) : 0;
  const compare_at_amount = formData.get('compare_at_amount') ? parseFloat(formData.get('compare_at_amount') as string) : null;
  const status = formData.get('status') as string;
  const listed_on_site = formData.get('listed_on_site') === 'true';
  
  const { error } = await supabase.from('products').update({
    title,
    slug,
    description,
    tagline,
    price_amount,
    compare_at_amount,
    status,
    listed_on_site
  }).eq('id', id);

  if (error) {
    console.error('Update product error:', error);
    throw new Error('Failed to update product');
  }

  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/admin/products`);
}

export async function addProductItem(formData: FormData) {
  const supabase = await createClient();
  const productId = formData.get('productId') as string;
  const itemType = formData.get('itemType') as string;
  const itemId = formData.get('itemId') as string;

  const { error } = await supabase.from('product_items').insert({
    product_id: productId,
    item_type: itemType,
    item_id: itemId
  });

  if (error) {
    console.error('Add product item error:', error);
    throw new Error('Failed to add item to product');
  }

  revalidatePath(`/admin/products/${productId}`);
}

export async function removeProductItem(formData: FormData) {
  const supabase = await createClient();
  const productId = formData.get('productId') as string;
  const itemId = formData.get('itemId') as string; // This is the ID of the product_items row

  const { error } = await supabase.from('product_items').delete().eq('id', itemId);

  if (error) {
    console.error('Remove product item error:', error);
    throw new Error('Failed to remove item from product');
  }

  revalidatePath(`/admin/products/${productId}`);
}
