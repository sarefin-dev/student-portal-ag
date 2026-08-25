import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeadsTable } from './leads-table';

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ page?: string, search?: string, status?: string }> }) {
  const { page: pageParam, search, status } = await searchParams;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const page = parseInt(pageParam || '1');
  const limit = 20;

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data: leads, count, error } = await query.range((page - 1) * limit, page * limit - 1);

  if (error) {
    console.error('Fetch leads error:', JSON.stringify(error, null, 2));
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
        <p className="text-muted-foreground">Track prospective students and manage CRM workflows.</p>
      </div>
      <LeadsTable 
        data={leads || []} 
        currentPage={page} 
        totalPages={count ? Math.ceil(count / limit) : 1}
        initialSearch={search || ''}
      />
    </div>
  );
}
