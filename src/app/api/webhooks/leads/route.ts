import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the service role key to bypass RLS because this is a server-to-server call (e.g. from Zapier)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Basic API Key validation if you want to secure it.
    // To use this, add WEBHOOK_SECRET_KEY to your .env file
    const authHeader = req.headers.get('Authorization');
    const webhookSecret = process.env.WEBHOOK_SECRET_KEY;
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, source, interested_in, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('leads').insert({
      name,
      email,
      phone,
      source: source || 'API Webhook',
      interested_in,
      notes,
      status: 'new'
    }).select().single();

    if (error) {
      console.error('Failed to insert lead via webhook:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data }, { status: 201 });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
