import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Edit } from 'lucide-react';
import { deleteAssessment } from './actions';

export default async function AssessmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  // Fetch all assessments for this course.
  // We need to fetch modules and lessons to map them.
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, submodules(id, title, lessons(id, title))')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  const moduleIds = modules?.map((m: any) => m.id) || [];
  let lessonIds: string[] = [];
  modules?.forEach((m: any) => {
    m.submodules?.forEach((s: any) => {
      s.lessons?.forEach((l: any) => {
        lessonIds.push(l.id);
      });
    });
  });

  // Now fetch assessments that belong to these modules or lessons
  let assessments: any[] = [];
  if (moduleIds.length > 0 || lessonIds.length > 0) {
    let query = supabase.from('assessments').select('*').order('created_at', { ascending: false });
    
    // Construct OR query manually since Supabase OR with arrays is tricky
    const orClauses = [];
    if (moduleIds.length > 0) orClauses.push(`module_id.in.(${moduleIds.join(',')})`);
    if (lessonIds.length > 0) orClauses.push(`lesson_id.in.(${lessonIds.join(',')})`);
    
    if (orClauses.length > 0) {
      query = query.or(orClauses.join(','));
      const { data } = await query;
      assessments = data || [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex h-14 items-center border-b pb-4 mb-6">
        <Link href={`/admin/courses/${courseId}/builder`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to Course Builder
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-muted-foreground">Manage quizzes and assignments for {course.title}.</p>
        </div>
        <Button asChild>
          <Link href={`/admin/courses/${courseId}/assessments/new`}>
            <Plus className="w-4 h-4 mr-2" />
            Create Assessment
          </Link>
        </Button>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded border bg-card p-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">No assessments</h3>
          <p className="mb-4">You haven't created any assessments for this course yet.</p>
          <Button asChild variant="outline">
            <Link href={`/admin/courses/${courseId}/assessments/new`}>Create one now</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a: any) => {
            const attachedTo = a.module_id ? 'Module' : 'Lesson';
            return (
              <div key={a.id} className="rounded-lg border bg-card p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{a.title}</h3>
                  <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                    <span>Attached to: {attachedTo}</span>
                    <span>•</span>
                    <span>{a.is_required ? 'Required to progress' : 'Optional'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/courses/${courseId}/assessments/${a.id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Questions
                    </Link>
                  </Button>
                  <form action={deleteAssessment}>
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="assessmentId" value={a.id} />
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" type="submit">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
