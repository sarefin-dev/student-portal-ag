import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Revalidate this API route cache every 60 seconds (ISR)
export const revalidate = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_items (
        id,
        item_type,
        item_id,
        quantity,
        is_free
      )
    `)
    .eq('slug', slug)
    .eq('listed_on_site', true)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // If this product contains courses, we fetch their details (outcomes, duration, etc)
  const courseItems = product.product_items?.filter((pi: any) => pi.item_type === 'course') || [];
  if (courseItems.length > 0) {
    const courseIds = courseItems.map((pi: any) => pi.item_id);
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, outcomes, duration, start_date, end_date')
      .in('id', courseIds);

    // Map course details back to product_items
    product.product_items = product.product_items.map((pi: any) => {
      if (pi.item_type === 'course') {
        const courseDetail = courses?.find(c => c.id === pi.item_id);
        
        // Compute "In Progress" logic for marketing site
        let computed_cohort_state = 'not_started';
        if (courseDetail?.start_date) {
          const now = new Date();
          const startDate = new Date(courseDetail.start_date);
          const endDate = courseDetail.end_date ? new Date(courseDetail.end_date) : null;

          if (now >= startDate) {
            if (endDate && now > endDate) {
              computed_cohort_state = 'completed';
            } else {
              computed_cohort_state = 'in_progress';
            }
          }
        }

        return { ...pi, course: { ...courseDetail, computed_cohort_state } };
      }
      return pi;
    });
  }

  // Same logic can be added here for digital_assets and services

  return NextResponse.json(product, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
    }
  });
}
