import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { env } from '@/env';

// This is the expected format from the Android SMS Forwarder app.
// We expect a POST request with JSON body.
export async function POST(req: Request) {
  try {
    // 1. Basic Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.SMS_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const smsText = body.text || body.message || body.body;
    
    if (!smsText) {
      return NextResponse.json({ error: 'Missing SMS text payload' }, { status: 400 });
    }

    // 2. Parse the SMS
    const parsed = parseSms(smsText);
    
    if (!parsed) {
      // If we cannot parse it, it's either not a payment SMS or from an unsupported provider.
      // We return 200 so the forwarder doesn't keep retrying non-payment messages.
      return NextResponse.json({ received: true, ignored: true });
    }

    // 3. Admin client (we need service role to mutate global transaction tables securely)
    // Actually, `createClient` uses the anon key and relies on RLS, but since webhooks run server-side and are unauthenticated by a user session,
    // we need to bypass RLS to insert into `received_transactions` and run the matcher.
    // Let's instantiate a direct Supabase admin client using the service role key.
    
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Save the parsed transaction
    const { data: rx, error: insertErr } = await supabaseAdmin
      .from('received_transactions')
      .insert({
        provider: parsed.provider,
        parsed_trx_id: parsed.trxId,
        parsed_amount: parsed.amount,
        sender_msisdn: parsed.sender,
        raw_sms_text: smsText
      })
      .select('id')
      .single();

    if (insertErr) {
      // If duplicate TrxID (due to unique constraint), we ignore and return 200 to ack the retry
      if (insertErr.code === '23505') {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw insertErr;
    }

    // 5. Attempt atomic match via RPC against any pending verifications
    const { data: pendingMatches } = await supabaseAdmin
      .from('pending_verifications')
      .select('id')
      .eq('submitted_trx_id', parsed.trxId)
      .eq('status', 'pending');

    if (pendingMatches) {
      for (const pending of pendingMatches) {
        await supabaseAdmin.rpc('match_pending_verification', { p_pending_verification_id: pending.id });
      }
    }

    return NextResponse.json({ success: true, transactionId: rx.id });

  } catch (error: unknown) {
    console.error("SMS Webhook error:", error);
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return NextResponse.json({ success: true, warning: 'Duplicate transaction ignored' });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function parseSms(text: string) {
  let provider: 'bkash' | 'nagad' | null = null;
  let amount: number | null = null;
  let trxId: string | null = null;
  let sender: string | null = null;

  // 1. bKash Matcher
  // "You have received Tk 508.23 from 01876623875... TrxID DHK3M7RCLJ"
  if (text.toLowerCase().includes('bkash') || text.includes('Tk') && text.includes('TrxID')) {
    provider = 'bkash';
    const amountMatch = text.match(/Tk\s*([\d,.]+)/);
    const senderMatch = text.match(/from\s*(\d{11})/);
    const trxIdMatch = text.match(/TrxID\s*([A-Z0-9]+)/);
    
    if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (senderMatch) sender = senderMatch[1];
    if (trxIdMatch) trxId = trxIdMatch[1];
  }

  // 2. Nagad Matcher
  // "Amount: Tk 499.00\nSender: 01711953826... TxnID: 75U0GIRB"
  else if (text.toLowerCase().includes('nagad') || text.includes('TxnID')) {
    provider = 'nagad';
    const amountMatch = text.match(/Amount:\s*Tk\s*([\d,.]+)/i) || text.match(/Tk\s*([\d,.]+)/);
    const senderMatch = text.match(/Sender:\s*(\d{11})/i) || text.match(/(\d{11})/);
    const trxIdMatch = text.match(/TxnID:\s*([A-Z0-9]+)/i);
    
    if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (senderMatch) sender = senderMatch[1];
    if (trxIdMatch) trxId = trxIdMatch[1];
  }

  return { provider, amount, trxId, sender };
}
