import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function CourseHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from('courses')
    .select('*, modules(submodules(lessons(id, title)))')
    .eq('slug', slug)
    .single();

  if (!course) notFound();

  // Find the first lesson to resume (for now, just grab the absolute first lesson in the curriculum)
  // In a real app, we'd query progress to find the last accessed lesson.
  let firstLessonId = null;
  if (course.modules && course.modules.length > 0) {
    course.modules?.sort((a: any, b: any) => a.position - b.position);
    course.modules?.forEach((m: any) => {
      m.submodules?.sort((a: any, b: any) => a.position - b.position);
      m.submodules?.forEach((s: any) => s.lessons?.sort((a: any, b: any) => a.position - b.position));
    });
    const firstModule = course.modules[0];
    if (firstModule && firstModule.submodules && firstModule.submodules.length > 0) {
      const firstSubmodule = firstModule.submodules[0];
      if (firstSubmodule && firstSubmodule.lessons && firstSubmodule.lessons.length > 0) {
        firstLessonId = firstSubmodule.lessons.sort((a: any, b: any) => a.position - b.position)[0].id;
      }
    }
  }

  // Get progress
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('completion_percent')
    .eq('course_id', course.id)
    .eq('student_id', user?.id)
    .single();

  const completionPercent = enrollment?.completion_percent || 0;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Welcome to {course.title}</h1>
        <p className="text-lg text-muted-foreground">
          Select a lesson from the syllabus on the left to begin learning, or resume where you left off.
        </p>
        {firstLessonId ? (
          <Link href={`/learn/${course.slug}/lessons/${firstLessonId}`}>
            <Button size="lg">Resume Course</Button>
          </Link>
        ) : (
          <Button size="lg" disabled>No lessons available</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h3 className="mb-2 font-bold text-lg">Your Progress</h3>
          <div className="h-4 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{completionPercent}% completed</p>
        </div>
        
        <div className="rounded-lg border p-6">
          <h3 className="mb-2 font-bold text-lg">Announcements</h3>
          <p className="text-sm text-muted-foreground">No new announcements from your instructor.</p>
        </div>
      </div>
    </div>
  );
}
