import { createClient } from '@/lib/supabase/server';
import { ManualEnrollForm } from './manual-enroll-form';

export default async function AdminManualEnrollPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, status, price_amount, created_at')
    .is('deleted_at', null)
    .order('title', { ascending: true });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Manual Enrollment</h1>
        <p className="text-muted-foreground">Admin override for course access.</p>
      </div>

      <ManualEnrollForm courses={courses || []} />
    </div>
  );
}
