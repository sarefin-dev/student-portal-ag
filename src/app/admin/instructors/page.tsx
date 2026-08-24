import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { InstructorsTable } from './instructors-table';
import { env } from '@/env';

export default async function AdminInstructorsPage({ searchParams }: { searchParams: Promise<{ page?: string, search?: string }> }) {
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
    .from('admin_student_profiles_view')
    .select('*', { count: 'estimated' })
    .neq('role', 'student');

  if (search) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: instructors, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Staff</h1>
      </div>
      <InstructorsTable 
        data={instructors || []} 
        currentPage={page} 
        totalPages={totalPages}
        initialSearch={search || ''}
      />
    </div>
  );
}
