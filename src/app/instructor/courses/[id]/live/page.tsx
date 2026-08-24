import { createClient } from '@/lib/supabase/server';
import { LiveSessionsManager } from './live-sessions-manager';

export default async function LiveSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('course_id', id)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true });

  return <LiveSessionsManager id={id} sessions={sessions || []} />;
}
