import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { StudentsTable } from './students-table';
import { env } from '@/env';

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ page?: string, search?: string, sort?: string, order?: string, status?: string }> }) {
  const { page: pageParam, search, sort, order, status } = await searchParams;
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
    .from('admin_student_profiles_view')
    .select('*', { count: 'estimated' })
    .eq('role', 'student');

  if (search) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  if (status) {
    queryBuilder = queryBuilder.eq('status', status);
  }

  // Handle sorting safely
  const allowedSortColumns = ['full_name', 'email', 'phone', 'status', 'created_at', 'last_sign_in_at'];
  if (sort && allowedSortColumns.includes(sort)) {
    queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc', nullsFirst: false });
  } else {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
  }

  const { data: students, count } = await queryBuilder
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
