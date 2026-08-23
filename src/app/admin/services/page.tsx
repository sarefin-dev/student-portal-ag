import { createClient } from '@/lib/supabase/server';
import { ServiceManager } from './service-manager';
import { redirect } from 'next/navigation';

export default async function AdminServicesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Services Library</h1>
        <p className="text-muted-foreground mt-2">
          Define human-delivered services (like CV Reviews or 1-on-1 Calls) that can be attached to Products or sold individually.
        </p>
      </div>

      <ServiceManager initialServices={services || []} />
    </div>
  );
}
