import { createClient } from '@/lib/supabase/server';
import { ResourceManager } from './resource-manager';

export default async function AdminResourcesPage() {
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Resources & Products</h1>
        <p className="text-muted-foreground">Manage standalone digital downloads, pricing, and watermarking.</p>
      </div>

      <ResourceManager resources={resources || []} />
    </div>
  );
}
