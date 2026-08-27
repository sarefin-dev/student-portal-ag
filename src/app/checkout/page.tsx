import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { startCheckout, submitTrxId } from './actions';
import Link from 'next/link';
import { AlertCircle, Copy, HelpCircle } from 'lucide-react';
import { RoutineSelector } from './routine-selector';

import { Logo } from '@/components/ui/logo';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ course?: string, bundle?: string, resource?: string, orderId?: string, step?: string, method?: string, error?: string }> }) {
  const params = await searchParams;
  const { course: courseId, bundle: bundleId, resource: resourceId, orderId, step, method, error } = params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (!resourceId && !orderId) {
      const returnPath = courseId ? `?course=${courseId}` : bundleId ? `?bundle=${bundleId}` : ``;
      redirect(`/login?redirectTo=${encodeURIComponent('/checkout' + returnPath)}`);
    }
  }

  // STEP 1: REVIEW
  if (!step || step === 'review') {
    if (!courseId && !bundleId && !resourceId) notFound();
    
    let itemTitle = '';
    let itemPrice = 0;
    let itemCurrency = 'BDT';
    let routines: any[] = [];

    if (courseId) {
      const { data } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (!data) notFound();
      itemTitle = data.title; itemPrice = data.price_amount; itemCurrency = data.currency;
      
      const { data: routineData } = await supabase.from('routines').select('*').eq('course_id', courseId).eq('status', 'active');
      if (routineData) routines = routineData;
    } else if (bundleId) {
      const { data } = await supabase.from('bundles').select('*').eq('id', bundleId).single();
      if (!data) notFound();
      itemTitle = data.title; itemPrice = data.price_amount; itemCurrency = data.currency;
    } else if (resourceId) {
      const { data } = await supabase.from('resources').select('*').eq('id', resourceId).single();
      if (!data || data.is_free) notFound();
      itemTitle = data.title; itemPrice = data.price_amount!; itemCurrency = data.currency;
    }

    return (
      <div className="container mx-auto py-6 md:py-12 px-4 max-w-lg">
        <div className="rounded-xl border bg-card p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-2 border-b">
            <Logo href="/" size="sm" subtitle="Secure Checkout" />
          </div>
          <h1 className="text-2xl font-bold">Review Your Order</h1>
          <div className="rounded border bg-muted/50 p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{itemTitle}</span>
              <span>{itemCurrency} {itemPrice}</span>
            </div>
          </div>
          
          <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
            <span>Subtotal:</span>
            <span>{itemCurrency} {itemPrice}</span>
          </div>

          <form action={startCheckout} className="space-y-4">
            {courseId && <input type="hidden" name="courseId" value={courseId} />}
            {bundleId && <input type="hidden" name="bundleId" value={bundleId} />}
            {resourceId && <input type="hidden" name="resourceId" value={resourceId} />}
            
            {routines.length > 0 && <RoutineSelector routines={routines} />}
            
            {!user && (
              <div className="space-y-4 rounded border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground font-medium">Guest Checkout</p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                  <input name="guestName" required placeholder="John Doe" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
                  <input name="guestEmail" type="email" required placeholder="john@example.com" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Coupon Code (Optional)</label>
              <input name="couponCode" placeholder="e.g. DISCOUNT20" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm uppercase" />
            </div>

            <Button size="lg" className="w-full" type="submit">Proceed to Payment</Button>
          </form>
        </div>
      </div>
    );
  }

  // ALL OTHER STEPS REQUIRE AN ORDER
  if (!orderId) redirect('/courses');

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, courses(*))')
    .eq('id', orderId)
    .single();

  if (!order || order.status !== 'pending') redirect('/dashboard');
  const courseName = order.order_items[0]?.courses?.title || 'Your Order';

  // STEP 2: METHOD SELECT
  if (step === 'method') {
    return (
      <div className="container mx-auto py-6 md:py-12 px-4 max-w-lg">
        <div className="rounded border bg-card p-8 shadow-none space-y-6">
          <h1 className="text-2xl font-bold">Select Payment Method</h1>
          <div className="space-y-4">
            <Link href={`/checkout?orderId=${orderId}&step=instructions&method=bkash`} className="block w-full text-left rounded border p-4 hover:border-ring transition-colors">
              <div className="font-semibold text-lg text-[#E2136E]">bKash</div>
              <div className="text-sm text-muted-foreground">Pay via Send Money</div>
            </Link>
            <Link href={`/checkout?orderId=${orderId}&step=instructions&method=nagad`} className="block w-full text-left rounded border p-4 hover:border-ring transition-colors">
              <div className="font-semibold text-lg text-[#ED1C24]">Nagad</div>
              <div className="text-sm text-muted-foreground">Pay via Send Money</div>
            </Link>
            <Link href={`/checkout?orderId=${orderId}&step=instructions&method=bank`} className="block w-full text-left rounded border p-4 hover:border-ring transition-colors opacity-70">
              <div className="font-semibold text-lg">Bank Transfer</div>
              <div className="text-sm text-muted-foreground">Manual confirmation. Takes longer.</div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: INSTRUCTIONS
  if (step === 'instructions') {
    return (
      <div className="container mx-auto py-6 md:py-12 px-4 max-w-lg">
        <div className="rounded border bg-card p-8 shadow-none space-y-6">
          <h1 className="text-2xl font-bold capitalize">{method === 'bank' ? 'Bank Transfer' : method} Instructions</h1>
          
          <div className="rounded bg-accent p-6 text-center space-y-2">
            <p className="text-sm uppercase tracking-wider font-semibold text-accent-foreground/70">Amount to send</p>
            <div className="text-4xl font-mono font-bold text-accent-foreground">৳ {order.total_amount}</div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 border rounded items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
              <div className="w-full">
                <p className="font-semibold mb-2">
                  {method === 'bank' ? 'Transfer to this Bank Account' : 'Send Money to this number'}
                </p>
                
                {method === 'bank' ? (
                  <div className="space-y-2 text-sm bg-muted p-3 rounded">
                    <p><span className="text-muted-foreground">Bank:</span> <strong>Dutch-Bangla Bank (DBBL)</strong></p>
                    <p><span className="text-muted-foreground">Acc Name:</span> <strong>ArefinLab IT</strong></p>
                    <p><span className="text-muted-foreground">Acc No:</span> <strong>123.456.7890</strong></p>
                    <p><span className="text-muted-foreground">Branch:</span> <strong>Gulshan Branch</strong></p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono bg-muted px-2 py-1 rounded">01700-000000</code>
                    <Button variant="ghost" size="sm" type="button"><Copy className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 p-4 border rounded items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <p className="font-semibold mb-1">Save the Transaction ID</p>
                <p className="text-sm text-muted-foreground">
                  {method === 'bank' ? 'Note down the transaction reference from your bank slip or app.' : 'After sending, you will receive a TrxID (e.g. DHK3M7RCLJ).'}
                </p>
              </div>
            </div>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href={`/checkout?orderId=${orderId}&step=submit&method=${method}`}>I have sent the money →</Link>
          </Button>
          
          <div className="text-center">
            <Link href={`/checkout?orderId=${orderId}&step=method`} className="text-sm text-muted-foreground hover:underline">← Change method</Link>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: SUBMIT TrxID
  if (step === 'submit') {
    return (
      <div className="container mx-auto py-12 max-w-lg">
        <div className="rounded border bg-card p-8 shadow-none space-y-6">
          <h1 className="text-2xl font-bold">Verify Payment</h1>
          <p className="text-muted-foreground">Enter the details of your {method === 'bank' ? 'bank transfer' : method + ' transaction'}.</p>

          {error === 'DuplicateTrxId' && (
            <div className="bg-destructive/10 text-destructive p-4 rounded flex gap-2 items-start text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>This Transaction ID is already recorded. If this is yours and you haven't been enrolled, please contact support.</p>
            </div>
          )}

          <form action={submitTrxId} className="space-y-4">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="provider" value={method} />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction ID (TrxID)</label>
              <input required name="trxId" placeholder={method === 'bank' ? "e.g. REF-123456" : "e.g. DHK3M7RCLJ"} className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 uppercase" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount Sent</label>
              <input required type="number" step="0.01" name="amount" defaultValue={order.total_amount} className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {method === 'bank' ? 'Bank Name & Branch' : 'Sender Number'}
              </label>
              <input required name="senderNumber" placeholder={method === 'bank' ? "e.g. Brac Bank, Gulshan" : "e.g. 01876623875"} className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>

            <Button size="lg" className="w-full mt-4" type="submit">Submit for Verification</Button>
          </form>

          <div className="pt-6 border-t">
            <div className="bg-muted p-4 rounded text-sm flex gap-3 items-start">
              <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold mb-1">Need help?</p>
                <p className="text-muted-foreground mb-2">If you're stuck, message us on WhatsApp or send a request. We reply within a few hours.</p>
                <Link href="/help" className="text-primary font-medium hover:underline">Contact Support</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
