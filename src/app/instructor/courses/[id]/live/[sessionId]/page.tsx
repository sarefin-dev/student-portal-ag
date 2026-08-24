import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { markAttendance } from './actions';
import { LocalTime } from '@/components/local-time';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function AttendancePage({ params }: { params: Promise<{ id: string, sessionId: string }> }) {
  const { id, sessionId } = await params;
  const supabase = await createClient();

  // Parallel fetch session, enrollments, and attendance
  const [sessionRes, enrollmentsRes, attendanceRes] = await Promise.all([
    supabase.from('live_sessions').select('*').eq('id', sessionId).is('deleted_at', null).single(),
    supabase.from('enrollments').select('student_id, profiles(full_name, email)').eq('course_id', id).eq('status', 'active'),
    supabase.from('attendance').select('*').eq('live_session_id', sessionId)
  ]);

  const session = sessionRes.data;
  if (!session) return notFound();

  const enrollments = enrollmentsRes.data || [];
  const attendanceList = attendanceRes.data || [];

  return (
    <div className="space-y-6 max-w-[720px] mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-semibold">Attendance: {session.title}</h1>
          <p className="text-muted-foreground"><LocalTime isoString={session.scheduled_at} /></p>
        </div>
        <Link href={`/instructor/courses/${id}/live`}>
          <Button variant="outline">Back to Sessions</Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2 px-4 font-medium">Student</th>
              <th className="py-2 px-4 font-medium">Email</th>
              <th className="py-2 px-4 font-medium">Status</th>
              <th className="py-2 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enr: any) => {
              const att = attendanceList.find((a: any) => a.student_id === enr.student_id);
              return (
                <tr key={enr.student_id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 px-4 font-medium">{enr.profiles.full_name}</td>
                  <td className="py-2 px-4 text-muted-foreground">{enr.profiles.email}</td>
                  <td className="py-2 px-4">
                    {!att ? (
                      <span className="text-muted-foreground text-xs font-semibold bg-muted px-2 py-1 rounded">Not Marked</span>
                    ) : att.present ? (
                      <span className="text-success text-xs font-semibold bg-success/10 px-2 py-1 rounded">Present</span>
                    ) : (
                      <span className="text-destructive text-xs font-semibold bg-destructive/10 px-2 py-1 rounded">Absent</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right space-x-2">
                    <form action={async () => {
                      'use server';
                      await markAttendance(sessionId, id, enr.student_id, true);
                    }} className="inline">
                      <Button variant="outline" size="sm" className="text-success border-success/30 hover:bg-success/10 hover:text-success">
                        Present
                      </Button>
                    </form>
                    <form action={async () => {
                      'use server';
                      await markAttendance(sessionId, id, enr.student_id, false);
                    }} className="inline">
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
                        Absent
                      </Button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No active enrollments for this course.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
