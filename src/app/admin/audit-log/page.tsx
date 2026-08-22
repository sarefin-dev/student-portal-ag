import { createClient } from '@/lib/supabase/server';
import { AuditLogTable } from './audit-log-table';

export default async function AdminAuditLogPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Immutable record of system changes.</p>
      </div>

      <AuditLogTable data={logs || []} />
    </div>
  );
}
