import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCourseBySlug } from '@/db/queries/courses';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { WaitlistForm } from './waitlist-form';

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const course = await getCourseBySlug(supabase, slug).catch(() => null);

  if (!course) {
    notFound();
  }

  const isCutoffPassed = ['live_cohort', 'in_person'].includes(course.type) && 
                         course.enrollment_cutoff_date && 
                         new Date(course.enrollment_cutoff_date) < new Date();

  // Check if user is already enrolled
  const { data: { user } } = await supabase.auth.getUser();
  let isEnrolled = false;

  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .eq('status', 'active')
      .maybeSingle();
      
    if (enrollment) {
      isEnrolled = true;
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-12 grid gap-8 md:grid-cols-2">
        <div>
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary capitalize">
            {course.type.replace('_', ' ')}
          </span>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight">{course.title}</h1>
          <MarkdownRenderer content={course.description || ''} className="mb-6 text-lg text-muted-foreground" />
          
          <div className="mb-8 flex items-center gap-4 text-2xl font-bold">
            {course.compare_at_price && course.compare_at_price > course.price_amount && (
              <span className="text-xl text-muted-foreground line-through font-normal">
                {course.currency} {course.compare_at_price}
              </span>
            )}
            <span>{course.currency} {course.price_amount}</span>
          </div>

          {isEnrolled ? (
            <Link href={`/learn/${course.slug}`}>
              <Button size="lg" className="w-full sm:w-auto" variant="secondary">
                Go to Course
              </Button>
            </Link>
          ) : course.status === 'coming_soon' ? (
            <WaitlistForm courseId={course.id} slug={course.slug} />
          ) : isCutoffPassed ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/20 mb-4">
              <h3 className="font-semibold text-lg">Enrollment Closed</h3>
              <p>The enrollment cutoff date for this cohort has passed.</p>
            </div>
          ) : (
            <Link href={`/checkout?course=${course.id}`}>
              <Button size="lg" className="w-full sm:w-auto">
                Enroll Now
              </Button>
            </Link>
          )}
        </div>
        <div className="aspect-video overflow-hidden rounded-lg bg-muted shadow-lg">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <span className="text-muted-foreground">Video Preview Placeholder</span>
            </div>
          )}
        </div>
      </div>

      {/* Outcomes & Syllabus */}
      <div className="grid gap-12 md:grid-cols-3">
        <div className="md:col-span-2 space-y-10">
          {course.outcomes && course.outcomes.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl font-bold">What you'll learn</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {course.outcomes.map((outcome: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 text-primary">✓</span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-2xl font-bold">Course Syllabus</h2>
            {(!course.modules || course.modules.length === 0) ? (
              <p className="text-muted-foreground">Syllabus is being updated.</p>
            ) : (
              <div className="space-y-4">
                {course.modules.map((module: any) => (
                  <div key={module.id} className="rounded-lg border p-4">
                    <h3 className="font-bold">{module.title}</h3>
                    {module.submodules?.length > 0 && (
                      <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                        {module.submodules.map((sub: any) => (
                          <li key={sub.id}>{sub.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        {/* Sticky Sidebar */}
        <div className="space-y-6">
          <div className="sticky top-6 rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 font-bold">Course Features</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span>📱</span> Access on mobile and desktop</li>
              <li className="flex items-center gap-2"><span>♾️</span> Perpetual access to materials</li>
              <li className="flex items-center gap-2"><span>🏆</span> Certificate of completion</li>
              {['live_cohort', 'in_person'].includes(course.type) && (
                <li className="flex items-center gap-2"><span>👥</span> {course.type === 'in_person' ? 'Physical classroom sessions' : 'Live cohort sessions'}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
