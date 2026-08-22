import { createClient } from '@/lib/supabase/server';
import { EnrollmentsTable } from './enrollments-table';

export default async function EnrollmentsPage() {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, profiles(id, full_name, email, status), courses(title)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Global Enrollments</h1>
        <p className="text-muted-foreground">Manage student access, suspend accounts, or ban from specific courses.</p>
      </div>

      <EnrollmentsTable data={enrollments || []} />
    </div>
  );
}
