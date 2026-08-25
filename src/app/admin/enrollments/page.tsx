import { createClient } from '@/lib/supabase/server';
import { EnrollmentsTable } from './enrollments-table';

export default async function EnrollmentsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  
  const page = parseInt(resolvedParams.page as string) || 1;
  const status = resolvedParams.status as string;
  const search = resolvedParams.search as string;
  
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabase
    .from('enrollments')
    .select('*, profiles!enrollments_student_id_fkey!inner(id, full_name, email, status), courses(title)', { count: 'exact' });

  if (status) {
    queryBuilder = queryBuilder.eq('profiles.status', status);
  }

  if (search) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`, { foreignTable: 'profiles' });
  }

  const { data: enrollments, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Global Enrollments</h1>
        <p className="text-muted-foreground">Manage student access, suspend accounts, or ban from specific courses.</p>
      </div>

      <EnrollmentsTable 
        data={enrollments || []} 
        currentPage={page} 
        totalPages={totalPages}
        initialSearch={search || ''}
      />
    </div>
  );
}
