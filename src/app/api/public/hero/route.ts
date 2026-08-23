import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export async function GET() {
  const supabase = await createClient();

  // 1. Fetch active hero schedule
  const now = new Date().toISOString();
  
  const { data: candidates, error: scheduleError } = await supabase
    .from('hero_schedule')
    .select(`
      *,
      products (
        id, slug, kind, title, tagline, description, price_amount, currency, compare_at_amount,
        enrollment_state, thumbnail_url, og_image_url, seo_title, seo_description,
        product_items (
          item_type, item_id
        )
      )
    `)
    .eq('enabled', true)
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('priority', { ascending: false })
    .order('starts_at', { ascending: false })
    .limit(1);

  let heroProduct = candidates && candidates.length > 0 ? candidates[0].products : null;
  let scheduleOverride = candidates && candidates.length > 0 ? candidates[0] : null;

  // 2. If no scheduled hero, fallback to default
  if (!heroProduct) {
    const { data: defaultHero } = await supabase
      .from('products')
      .select(`
        id, slug, kind, title, tagline, description, price_amount, currency, compare_at_amount,
        enrollment_state, thumbnail_url, og_image_url, seo_title, seo_description,
        product_items (
          item_type, item_id
        )
      `)
      .eq('is_hero_default', true)
      .single();
      
    if (defaultHero) {
      heroProduct = defaultHero;
    }
  }

  if (!heroProduct) {
    return NextResponse.json({ error: 'No hero product available' }, { status: 404 });
  }

  // 3. Resolve underlying item details (Course or Event or Digital Asset)
  let computed_state = 'upcoming';
  let launch_at = null;
  let seats_remaining = null;
  let preview_url = null;
  let product_type = null;

  // Since we only really care about the PRIMARY item in the product to drive the hero dates:
  if (heroProduct.product_items && heroProduct.product_items.length > 0) {
    const primaryItem = heroProduct.product_items[0];
    
    if (primaryItem.item_type === 'course') {
      const { data: course } = await supabase.from('courses').select('type, start_date, end_date').eq('id', primaryItem.item_id).single();
      if (course) {
        product_type = course.type; // e.g. ebook, recorded, live_cohort
        launch_at = course.start_date;
        const startDate = new Date(course.start_date);
        const endDate = course.end_date ? new Date(course.end_date) : null;
        const current = new Date();
        if (current >= startDate) {
          computed_state = endDate && current > endDate ? 'completed' : 'in_progress';
        } else {
          computed_state = 'upcoming';
        }
      }
    } else if (primaryItem.item_type === 'event') {
      const { data: event } = await supabase.from('events').select('event_type, starts_at, ends_at, capacity, status').eq('id', primaryItem.item_id).single();
      if (event) {
        product_type = event.event_type;
        launch_at = event.starts_at;
        const current = new Date();
        const start = new Date(event.starts_at);
        const end = new Date(event.ends_at);
        
        if (event.status === 'cancelled') computed_state = 'cancelled';
        else if (current < start) computed_state = 'upcoming';
        else if (current >= start && current <= end) computed_state = 'live';
        else computed_state = 'completed';

        // Capacity math
        if (event.capacity) {
          const { count } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', primaryItem.item_id).neq('status', 'cancelled');
          seats_remaining = event.capacity - (count || 0);
        }
      }
    }
  }

  // 4. CTA Label Rule
  let cta_label = scheduleOverride?.cta_label;
  if (!cta_label) {
    const isClosed = heroProduct.enrollment_state === 'closed' || computed_state === 'completed';
    const isUpcoming = heroProduct.enrollment_state === 'coming_soon' || heroProduct.enrollment_state === 'waitlist' || computed_state === 'upcoming';
    
    if (product_type === 'ebook' || product_type === 'digital_download') {
      cta_label = isUpcoming ? 'Pre-order' : 'Buy the book';
    } else if (heroProduct.kind === 'event') {
      if (isUpcoming) cta_label = 'Register';
      else if (computed_state === 'live') cta_label = 'Join live';
      else if (isClosed) cta_label = 'Watch recording';
    } else if (heroProduct.kind === 'service') {
      cta_label = isClosed ? 'Closed' : 'Book';
    } else {
      // Default cohort/course
      if (isUpcoming) cta_label = 'Join waitlist';
      else if (isClosed) cta_label = 'Notify me';
      else cta_label = 'Enroll now';
    }
  }

  // 5. Build DTO
  const heroDTO = {
    slug: heroProduct.slug,
    kind: heroProduct.kind,
    product_type: product_type,
    eyebrow: scheduleOverride?.eyebrow || null,
    headline: scheduleOverride?.headline || heroProduct.title,
    tagline: heroProduct.tagline,
    cover_image_url: heroProduct.thumbnail_url || heroProduct.og_image_url,
    price_amount: heroProduct.price_amount,
    currency: heroProduct.currency,
    compare_at_amount: heroProduct.compare_at_amount,
    enrollment_state: heroProduct.enrollment_state,
    computed_state: computed_state,
    launch_at: launch_at,
    seats_remaining: seats_remaining,
    preview_url: preview_url,
    cta_label: cta_label,
    checkout_slug: heroProduct.slug
  };

  return NextResponse.json(heroDTO, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
    }
  });
}
