'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateAdminPassword(formData: FormData) {
  const password = formData.get('password') as string;
  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({ password });
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}

export async function updateAIGateway(formData: FormData) {
  const url = formData.get('gatewayUrl') as string;
  if (!url) return { error: "URL is required" };

  const supabase = await createClient();
  
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key: 'ai_gateway', value: url });
    
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath('/admin/settings');
  return { success: true };
}
