import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, 
      slug, 
      kind, 
      title, 
      tagline, 
      thumbnail_url,
      price_amount, 
      currency, 
      compare_at_amount,
      enrollment_state, 
      pricing_model, 
      is_featured, 
      featured_rank
    `)
    .eq('listed_on_site', true)
    .order('featured_rank', { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
