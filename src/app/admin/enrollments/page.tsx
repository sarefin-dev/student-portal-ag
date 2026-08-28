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
  const status = resolvedParams.status as string; // account status
  const enrollmentStatus = resolvedParams.enrollment_status as string;
  const search = resolvedParams.search as string;
  const sort = resolvedParams.sort as string || 'created_at';
  const order = resolvedParams.order as string || 'desc';
  
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabase
    .from('enrollments')
    .select('*, profiles!enrollments_student_id_fkey!inner(id, full_name, email, status), courses!inner(title)', { count: 'exact' });

  if (status) {
    queryBuilder = queryBuilder.eq('profiles.status', status);
  }
  
  if (enrollmentStatus) {
    queryBuilder = queryBuilder.eq('status', enrollmentStatus);
  }

  if (search) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`, { foreignTable: 'profiles' });
  }

  const { data: enrollments, count } = await queryBuilder
    .order(sort, { ascending: order === 'asc' })
    .range(from, to);

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, status, price_amount, currency')
    .eq('status', 'active')
    .order('title', { ascending: true });

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Global Enrollments</h1>
        <p className="text-muted-foreground">Manage student access, suspend accounts, or ban from specific courses.</p>
      </div>

      <EnrollmentsTable 
        data={enrollments || []} 
        totalPages={totalPages} 
        currentPage={page} 
        courses={courses || []}
        initialSearch={search || ''}
      />
    </div>
  );
}
