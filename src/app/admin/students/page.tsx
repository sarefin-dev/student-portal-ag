import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { StudentsTable } from './students-table';
import { env } from '@/env';

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ page?: string, search?: string }> }) {
  const { page: pageParam, search } = await searchParams;
  const supabase = await createClient();

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Ensure admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const page = parseInt(pageParam as string) || 1;
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'student');

  if (search) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: students, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Students Directory</h1>
        <p className="text-muted-foreground">Manage all registered students in the platform.</p>
      </div>

      <StudentsTable 
        data={students || []} 
        currentPage={page} 
        totalPages={totalPages} 
        initialSearch={search || ''} 
      />
    </div>
  );
}
