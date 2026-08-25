import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  source: z.string().optional().default('Webhook'),
  interested_in: z.string().optional().or(z.literal('')),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const webhookSecret = process.env.WEBHOOK_SECRET_KEY;
    
    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET_KEY is not configured on the server.');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    
    if (authHeader !== "Bearer ${webhookSecret}") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.from('leads').upsert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: parsed.data.source,
      interested_in: parsed.data.interested_in,
    }, { onConflict: 'phone, interested_in', ignoreDuplicates: true }).select();

    if (error) {
      console.error('Webhook insert error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error('Webhook unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

