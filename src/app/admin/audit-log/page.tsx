import { createClient } from '@/lib/supabase/server';
import { AuditLogTable } from './audit-log-table';

export default async function AdminAuditLogPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page as string) || 1;
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: logs, count } = await supabase
    .from('audit_log')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Immutable record of system changes.</p>
      </div>

      <AuditLogTable 
        data={logs || []} 
        currentPage={page} 
        totalPages={totalPages} 
      />
    </div>
  );
}
