import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      completion_percent,
      course_id,
      courses (
        title,
        slug,
        thumbnail_url
      )
    `)
    .eq('student_id', user?.id)
    .eq('status', 'active');

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, enrollments!inner(student_id, courses(title))')
    .eq('enrollments.student_id', user?.id)
    .order('issued_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <Link href="/courses">
          <Button variant="outline">Browse Catalog</Button>
        </Link>
      </div>

      {(!enrollments || enrollments.length === 0) ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          You are not enrolled in any courses yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enr: any) => {
            const course = enr.courses;
            return (
              <div key={enr.course_id} className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                <div className="aspect-video w-full bg-muted">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <span className="text-sm font-medium text-secondary-foreground">Course Image</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-4 text-xl font-bold leading-tight">{course.title}</h3>
                  <div className="mb-6 mt-auto">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Progress</span>
                      <span className="font-bold">{enr.completion_percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${enr.completion_percent}%` }} />
                    </div>
                  </div>
                  <Link href={`/learn/${course.slug}`} className="w-full">
                    <Button className="w-full">Continue Learning</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {certificates && certificates.length > 0 && (
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold">My Certificates</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="flex flex-col overflow-hidden rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold">{cert.enrollments.courses.title}</h3>
                  <p className="text-sm text-muted-foreground">Issued: {new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={`/api/certificates/${cert.id}/download`} target="_blank" rel="noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full">Download PDF</Button>
                  </a>
                  <a href={`/verify/${cert.verify_code}`} target="_blank" rel="noreferrer" className="flex-1">
                    <Button variant="secondary" className="w-full">Verify Page</Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
