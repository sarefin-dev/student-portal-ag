import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Clock, HelpCircle } from 'lucide-react';

export default async function PendingVerificationPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pending } = await supabase
    .from('pending_verifications')
    .select('*, orders(*)')
    .eq('id', id)
    .single();

  if (!pending) notFound();

  // If already verified, show success
  if (pending.status === 'matched') {
    return (
      <div className="container mx-auto py-16 max-w-lg text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
        <h1 className="text-3xl font-bold">Payment Verified!</h1>
        <p className="text-muted-foreground text-lg">Your transaction has been successfully matched and your enrollment is complete.</p>
        <div className="pt-8">
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Verifying state (PAY-05)
  return (
    <div className="container mx-auto py-12 max-w-lg">
      <div className="rounded border bg-card p-8 shadow-none space-y-6 text-center">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-primary animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-bold">Verifying Payment</h1>
        
        <div className="bg-muted p-4 rounded text-sm text-left space-y-2">
          <p><strong>Transaction ID:</strong> {pending.submitted_trx_id}</p>
          <p><strong>Amount:</strong> Tk {pending.submitted_amount}</p>
          <p><strong>Submitted:</strong> {new Date(pending.created_at).toLocaleString()}</p>
        </div>

        <p className="text-muted-foreground">
          Payment received. Our system is currently verifying your transaction. You will get an email <strong>within a few hours</strong> once your course is unlocked. No need to call or message.
        </p>
        <p className="text-sm bg-accent text-accent-foreground p-3 rounded">
          বাংলা: আপনার পেমেন্ট ইনফো পেয়েছি। ভেরিফাই হতে কয়েক ঘণ্টা সময় লাগতে পারে। কোর্স চালু হলে ইমেইলে জানানো হবে।
        </p>

        <div className="pt-6 space-y-3">
          <Button asChild variant="outline" className="w-full">
            <a href={`/checkout/pending?id=${id}`}>Refresh Status</a>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
        
        <div className="pt-6 border-t mt-6 text-left">
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">If it's been more than 24 hours, or you entered the wrong amount, please let us know.</p>
              <Link href="/help" className="text-sm text-primary font-medium hover:underline block mt-1">Contact Support</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
