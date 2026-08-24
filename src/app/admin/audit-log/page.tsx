import { createClient } from '@/lib/supabase/server';
import { AuditLogTable } from './audit-log-table';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';

export default async function AdminAuditLogPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page as string) || 1;
  const action = resolvedParams.action as string;
  const entity_type = resolvedParams.entity_type as string;
  const sort = resolvedParams.sort as string;
  const order = resolvedParams.order as string;

  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabaseAdmin
    .from('audit_log')
    .select('*, profiles(full_name, email)', { count: 'exact' });

  if (action) {
    queryBuilder = queryBuilder.eq('action', action);
  }
  if (entity_type) {
    queryBuilder = queryBuilder.eq('entity_type', entity_type);
  }

  const allowedSortColumns = ['created_at', 'action', 'entity_type'];
  if (sort && allowedSortColumns.includes(sort)) {
    queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc', nullsFirst: false });
  } else {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
  }

  const { data: logs, count } = await queryBuilder.range(from, to);

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
