import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addModule, addSubmodule, addLesson, publishCourse, unpublishCourse, updatePrice, setComingSoon } from './actions';

export default async function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch course and its hierarchy
  const { data: course } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id, title, position,
        submodules (
          id, title, position,
          lessons (
            id, title, position
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!course) {
    notFound();
  }

  // Sort modules
  course.modules?.sort((a: any, b: any) => a.position - b.position);
  course.modules?.forEach((m: any) => {
    m.submodules?.sort((a: any, b: any) => a.position - b.position);
    m.submodules?.forEach((s: any) => s.lessons?.sort((a: any, b: any) => a.position - b.position));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Builder: {course.title}</h1>
          <p className="text-muted-foreground">Status: <span className="capitalize font-bold">{course.status}</span></p>
        </div>
        <div className="flex gap-4">
          <Link href={`/admin/courses/${course.id}/settings`}>
            <Button variant="outline">General Settings</Button>
          </Link>
          <Link href={`/admin/courses/${course.id}/assessments`}>
            <Button variant="outline">Manage Assessments</Button>
          </Link>
          
          {course.status !== 'coming_soon' && course.status !== 'active' && (
            <form action={setComingSoon}>
              <input type="hidden" name="courseId" value={course.id} />
              <Button variant="secondary">Set Coming Soon</Button>
            </form>
          )}

          {course.status !== 'active' ? (
            <form action={publishCourse}>
              <input type="hidden" name="courseId" value={course.id} />
              <Button variant="default">Publish Course</Button>
            </form>
          ) : (
            <form action={unpublishCourse}>
              <input type="hidden" name="courseId" value={course.id} />
              <Button variant="destructive">Deactivate Course</Button>
            </form>
          )}
        </div>
      </div>

      <div className="rounded border bg-card p-6 shadow-none flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Course Price Settings</h2>
          <p className="text-sm text-muted-foreground">Set the price for the public checkout page.</p>
        </div>
        <form action={updatePrice} className="flex flex-col sm:flex-row items-end gap-4">
          <input type="hidden" name="courseId" value={course.id} />
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Selling Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Tk</span>
              <Input name="price_amount" type="number" step="0.01" defaultValue={course.price_amount} className="pl-8 w-32" />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Original Price (Strike)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Tk</span>
              <Input name="compare_at_price" type="number" step="0.01" defaultValue={course.compare_at_price || ''} className="pl-8 w-32" placeholder="Optional" />
            </div>
          </div>

          <Button variant="outline" type="submit" className="h-10">Update Price</Button>
        </form>
      </div>

      <div className="rounded border bg-card p-6 shadow-none">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <h2 className="text-xl font-bold">Curriculum</h2>
          <form action={addModule} className="flex items-center gap-2">
            <input type="hidden" name="courseId" value={course.id} />
            <Input name="title" placeholder="New Module Title" className="h-9 w-48" required />
            <Button size="sm" type="submit">+ Add Module</Button>
          </form>
        </div>

        {(!course.modules || course.modules.length === 0) ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            No modules yet. Add your first module to start building.
          </div>
        ) : (
          <div className="space-y-6">
            {course.modules.map((module: any) => (
              <div key={module.id} className="rounded-lg border bg-muted/10 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-2 mb-4">
                  <h3 className="text-lg font-bold">Module {module.position}: {module.title}</h3>
                  <form action={addSubmodule} className="flex items-center gap-2">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={module.id} />
                    <Input name="title" placeholder="Submodule Title" className="h-8 w-40 text-sm" required />
                    <Button variant="outline" size="sm" type="submit">+ Submodule</Button>
                  </form>
                </div>

                <div className="space-y-4 pl-4">
                  {module.submodules?.map((sub: any) => (
                    <div key={sub.id} className="rounded border bg-background p-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                        <h4 className="font-semibold text-primary">Submodule {sub.position}: {sub.title}</h4>
                        <form action={addLesson} className="flex items-center gap-2">
                          <input type="hidden" name="courseId" value={course.id} />
                          <input type="hidden" name="submoduleId" value={sub.id} />
                          <Input name="title" placeholder="Lesson Title" className="h-7 w-40 text-xs" required />
                          <Button variant="secondary" size="sm" className="h-7 text-xs" type="submit">+ Lesson</Button>
                        </form>
                      </div>

                      <div className="space-y-2 pl-4">
                        {sub.lessons?.map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center justify-between rounded-md border border-dashed p-2 text-sm">
                            <span>Lesson {lesson.position}: {lesson.title}</span>
                            <div className="flex gap-2">
                              <Link href={`/admin/courses/${course.id}/builder/lessons/${lesson.id}`}>
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">Edit Content</Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
