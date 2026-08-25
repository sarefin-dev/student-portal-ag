'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function startCheckout(formData: FormData) {
  const courseId = formData.get('courseId') as string | null;
  const bundleId = formData.get('bundleId') as string | null;
  const resourceId = formData.get('resourceId') as string | null;
  const couponCode = (formData.get('couponCode') as string || '').trim().toUpperCase();
  const guestName = (formData.get('guestName') as string || '').trim();
  const guestEmail = (formData.get('guestEmail') as string || '').trim();
  
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  
  let targetUserId = user?.id;

  if (!targetUserId) {
    if (!resourceId) {
      redirect('/login');
    }
    if (!guestEmail || !guestName) {
      throw new Error('Name and Email are required for guest checkout');
    }

    // Shadow Account Flow
    const { env } = await import('@/env');
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id').eq('email', guestEmail).maybeSingle();
    
    if (existingProfile) {
      targetUserId = existingProfile.id;
    } else {
      // Create shadow account
      const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(guestEmail, {
        data: { full_name: guestName }
      });
      if (inviteErr || !inviteData.user) {
        throw new Error('Failed to create guest account: ' + (inviteErr?.message || 'Unknown error'));
      }
      targetUserId = inviteData.user.id;
    }
  }

  let itemTitle = '';
  let itemPrice = 0;
  let itemType: 'course' | 'bundle' | 'resource' = 'course';

  if (courseId) {
    const { data: course } = await supabase.from('courses').select('id, title, price_amount, type, enrollment_cutoff_date, status').eq('id', courseId).single();
    if (!course) throw new Error('Course not found');
    
    if (course.status === 'coming_soon') {
      redirect(`/courses?error=${encodeURIComponent('This course is coming soon and not open for enrollment yet.')}`);
    }

    if (['live_cohort', 'in_person'].includes(course.type) && course.enrollment_cutoff_date && new Date(course.enrollment_cutoff_date) < new Date()) {
      redirect(`/courses?error=${encodeURIComponent('Enrollment for this cohort is closed')}`);
    }

    itemTitle = course.title;
    itemPrice = course.price_amount;
  } else if (bundleId) {
    const { data: bundle } = await supabase.from('bundles').select('id, title, price_amount').eq('id', bundleId).single();
    if (!bundle) throw new Error('Bundle not found');
    itemTitle = bundle.title;
    itemPrice = bundle.price_amount;
    itemType = 'bundle';
  } else if (resourceId) {
    const { data: resource } = await supabase.from('resources').select('id, title, price_amount, is_free').eq('id', resourceId).single();
    if (!resource || resource.is_free) throw new Error('Resource not found or free');
    itemTitle = resource.title;
    itemPrice = resource.price_amount!;
    itemType = 'resource';
  } else {
    throw new Error('No item specified');
  }

  const { env } = await import('@/env');
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  let discountAmount = 0;
  let couponId = null;

  if (couponCode) {
    const { data: coupon } = await supabaseAdmin.from('coupons').select('*').eq('code', couponCode).is('deleted_at', null).single();
    if (coupon) {
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('Coupon expired');
      }
      if (coupon.discount_type === 'percent') {
        discountAmount = itemPrice * (coupon.discount_value / 100);
      } else {
        discountAmount = coupon.discount_value;
      }
      if (discountAmount > itemPrice) discountAmount = itemPrice;
      couponId = coupon.id;
    } else {
      throw new Error('Invalid coupon code');
    }
  }

  const finalAmount = itemPrice - discountAmount;

  // Create a draft order
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      student_id: targetUserId,
      subtotal_amount: itemPrice,
      total_amount: finalAmount,
      status: 'pending'
    })
    .select('id')
    .single();

  if (error || !order) {
    throw new Error(`Failed to create order: ${error?.message || 'Unknown error'}`);
  }

  // Create order item
  const routineId = formData.get('routineId') as string | null;
  
  await supabaseAdmin
    .from('order_items')
    .insert({
      order_id: order.id,
      item_type: itemType,
      course_id: itemType === 'course' ? courseId : null,
      bundle_id: itemType === 'bundle' ? bundleId : null,
      resource_id: itemType === 'resource' ? resourceId : null,
      routine_id: routineId || null,
      unit_price_amount: itemPrice
    });

  if (couponId) {
    await supabaseAdmin.from('coupon_redemptions').insert({
      coupon_id: couponId,
      order_id: order.id,
      student_id: targetUserId
    });
  }

  redirect(`/checkout?orderId=${order.id}&step=method`);
}

export async function submitTrxId(formData: FormData) {
  const { env } = await import('@/env');
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const supabase = await createClient();

  const orderId = formData.get('orderId') as string;
  const provider = formData.get('provider') as string;
  const trxId = (formData.get('trxId') as string).toUpperCase();
  const amount = parseFloat(formData.get('amount') as string);
  const senderNumber = formData.get('senderNumber') as string;

  // Use admin client so guests can submit payment for their unguessable UUID order
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  // Check if TrxID already exists globally in pending_verifications
  const { data: duplicate } = await supabaseAdmin
    .from('pending_verifications')
    .select('id')
    .eq('submitted_trx_id', trxId)
    .single();

  if (duplicate) {
    redirect(`/checkout?orderId=${orderId}&step=submit&method=${provider}&error=DuplicateTrxId`);
  }

  // Find an unconsumed received transaction matching trxId and amount using admin client (bypassing RLS)
  const { data: match } = await supabaseAdmin
    .from('received_transactions')
    .select('id')
    .eq('parsed_trx_id', trxId)
    .eq('parsed_amount', amount)
    .is('consumed_by_pending_verification_id', null)
    .single();
    
  // Insert the pending verification securely using admin to allow guests
  const { data: pending, error } = await supabaseAdmin
    .from('pending_verifications')
    .insert({
      order_id: orderId,
      method: provider,
      submitted_trx_id: trxId,
      submitted_amount: amount,
      submitted_sender_msisdn: senderNumber,
      status: 'pending',
      source: 'checkout'
    })
    .select('id')
    .single();

  if (error || !pending) {
    console.error("Failed to insert pending verification", error);
    throw new Error('Failed to submit verification');
  }

  // Attempt atomic match via RPC
  await supabaseAdmin.rpc('match_pending_verification', { p_pending_verification_id: pending.id });

  redirect(`/checkout/pending?id=${pending.id}`);
}
