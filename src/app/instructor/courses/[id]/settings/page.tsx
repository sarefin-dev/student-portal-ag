import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CourseSettingsForm } from './settings-form';

export default async function CourseSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex h-14 items-center border-b pb-4 mb-6">
        <Link href={`/instructor/courses/${courseId}/builder`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to Course Builder
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Course Settings</h1>
        <p className="text-muted-foreground">Manage details and thumbnails for {course.title}.</p>
      </div>

      <div className="rounded border bg-card p-6 shadow-sm">
        <CourseSettingsForm course={course} />
      </div>
    </div>
  );
}
