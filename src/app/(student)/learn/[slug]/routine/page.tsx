import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RoutineList } from './routine-list';

export default async function RoutinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // Parallel fetch user and course
  const [userRes, courseRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('courses').select('id, title').eq('slug', slug).single()
  ]);

  const user = userRes.data.user;
  const course = courseRes.data;
  if (!course) notFound();

  // Fetch enrollment to get routine_id
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('routine_id')
    .eq('course_id', course.id)
    .eq('student_id', user?.id)
    .single();

  // Parallel fetch sessions and attendance
  const [sessionsRes, attendanceRes] = await Promise.all([
    supabase
      .from('live_sessions')
      .select('*')
      .eq('course_id', course.id)
      .eq('routine_id', enrollment?.routine_id || '00000000-0000-0000-0000-000000000000') // prevent matching all if null? Actually if it's null maybe they are legacy, but our migration fixed that. Let's just eq on routine_id if it exists.
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('attendance')
      .select('live_session_id, present')
      .eq('student_id', user?.id)
  ]);

  const sessions = sessionsRes.data || [];
  const attendanceList = attendanceRes.data || [];

  return (
    <div className="p-8 max-w-[720px] mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Class Routine</h1>
        <p className="text-muted-foreground">
          Upcoming live sessions and meeting links for {course.title}.
        </p>
      </div>

      <RoutineList sessions={sessions} attendanceList={attendanceList} />
    </div>
  );
}

