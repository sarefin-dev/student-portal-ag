import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch real counts
  const [
    { count: studentCount },
    { count: courseCount },
    { count: pendingVerifications, error: pendingErr }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'active'),
    supabase.from('pending_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-medium text-muted-foreground">Total Students</h3>
          <p className="mt-2 text-4xl font-bold">{studentCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-medium text-muted-foreground">Active Courses</h3>
          <p className="mt-2 text-4xl font-bold">{courseCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-medium text-muted-foreground">Pending Verifications</h3>
          <p className="mt-2 text-4xl font-bold">{pendingVerifications || 0}</p>
        </div>
      </div>
    </div>
  )
}
