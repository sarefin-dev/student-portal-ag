import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createAssessment } from '../actions';

export default async function NewAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  // Fetch modules and lessons for the dropdown
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, submodules(id, title, lessons(id, title))')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex h-14 items-center border-b pb-4 mb-6">
        <Link href={`/instructor/courses/${courseId}/assessments`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to Assessments
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Create Assessment</h1>
        <p className="text-muted-foreground">Attach a new quiz or assignment to {course.title}.</p>
      </div>

      <div className="rounded border bg-card p-6 shadow-sm">
        <form action={createAssessment} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input name="title" required placeholder="e.g. Chapter 1 Quiz" className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Instructions (Optional)</label>
            <textarea name="instructions" rows={3} placeholder="e.g. Answer all questions to the best of your ability." className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Attach To</label>
            <select name="targetId" required className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background">
              <option value="">Select a Module or Lesson...</option>
              {modules?.map((m: any) => (
                <optgroup key={m.id} label={`Module: ${m.title}`}>
                  <option value={`module|${m.id}`}>Entire Module: {m.title}</option>
                  {m.submodules?.map((s: any) => (
                    s.lessons?.map((l: any) => (
                      <option key={l.id} value={`lesson|${l.id}`}>-- Lesson: {l.title}</option>
                    ))
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isRequired" name="isRequired" value="true" className="w-4 h-4 rounded border-gray-300" />
            <label htmlFor="isRequired" className="text-sm font-medium">Required to progress</label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">If checked, students cannot proceed to the next module/lesson until they pass this assessment.</p>

          <div className="pt-6">
            <Button type="submit" className="w-full">Create Assessment</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
