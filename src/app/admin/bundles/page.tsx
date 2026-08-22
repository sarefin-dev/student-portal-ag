import { createClient } from '@/lib/supabase/server';
import { BundleManager } from './bundle-manager';

export default async function AdminBundlesPage() {
  const supabase = await createClient();

  const [bundlesRes, coursesRes] = await Promise.all([
    supabase
      .from('bundles')
      .select('*, bundle_items(id, courses(title))')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('courses')
      .select('id, title')
      .eq('is_published', true)
      .order('title', { ascending: true })
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Course Bundles</h1>
        <p className="text-muted-foreground">Group multiple courses together for a single purchase price.</p>
      </div>

      <BundleManager 
        bundles={bundlesRes.data || []} 
        courses={coursesRes.data || []} 
      />
    </div>
  );
}
