import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  if (profile?.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Fetch all leads
  const { data: leads } = await supabase.from('leads').select('name, email, phone, status').is('deleted_at', null);
  
  // Fetch all profiles (registered users)
  const { data: profiles } = await supabase.from('profiles').select('full_name, email, phone');

  // Combine and deduplicate by email
  const contactMap = new Map();

  // Add leads first
  leads?.forEach(lead => {
    if (lead.email) {
      contactMap.set(lead.email.toLowerCase(), {
        name: lead.name || '',
        email: lead.email,
        phone: lead.phone || '',
        source: lead.status === 'converted' ? 'Converted Lead' : 'Lead'
      });
    }
  });

  // Add profiles (will overwrite leads if email matches, upgrading them to 'Registered User')
  profiles?.forEach(p => {
    if (p.email) {
      contactMap.set(p.email.toLowerCase(), {
        name: p.full_name || '',
        email: p.email,
        phone: p.phone || '',
        source: 'Registered User'
      });
    }
  });

  const contacts = Array.from(contactMap.values());

  // Generate CSV
  const header = ['Name', 'Email', 'Phone', 'Source'].join(',');
  const rows = contacts.map(c => {
    const escaped = [
      (c.name || '').replace(/"/g, '""'),
      (c.email || '').replace(/"/g, '""'),
      (c.phone || '').replace(/"/g, '""'),
      (c.source || '').replace(/"/g, '""')
    ];
    return '"' + escaped.join('","') + '"';
  });

  const csvContent = [header, ...rows].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="advertising_contacts.csv"',
    },
  });
}
