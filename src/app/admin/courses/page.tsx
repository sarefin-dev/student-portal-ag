import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Courses</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/courses/new">
                <Button size="icon" className="h-9 w-9">
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">Create Course</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Course</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="rounded-md border">
        {(!courses || courses.length === 0) ? (
          <div className="p-8 text-center text-muted-foreground">No courses found.</div>
        ) : (
          <div className="divide-y">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-bold">{course.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{course.type}</span>
                    <span>•</span>
                    <span className="capitalize">{course.status}</span>
                  </div>
                </div>
                <Link href={`/admin/courses/${course.id}/builder`}>
                  <Button variant="outline">Builder</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
