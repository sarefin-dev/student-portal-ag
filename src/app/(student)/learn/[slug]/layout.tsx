import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from 'lucide-react';

export default async function ClassroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select(`
      id, title, slug,
      modules (
        id, title, position,
        submodules (
          id, title, position,
          lessons (id, title, position)
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (!course) notFound();

  // Sort modules
  course.modules?.sort((a: any, b: any) => a.position - b.position);
  course.modules?.forEach((m: any) => {
    m.submodules?.sort((a: any, b: any) => a.position - b.position);
    m.submodules?.forEach((s: any) => s.lessons?.sort((a: any, b: any) => a.position - b.position));
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Syllabus Sidebar */}
      <aside className="w-full border-r bg-muted/20 md:w-80 md:flex-shrink-0 flex flex-col h-screen">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">{course.title}</h2>
        </div>

        <div className="px-4 py-2 border-b">
          <Link href={`/learn/${course.slug}/routine`}>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer transition-colors">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Class Routine</span>
            </div>
          </Link>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {course.modules?.map((mod: any) => (
              <div key={mod.id}>
                <h3 className="font-semibold">{mod.title}</h3>
                {mod.submodules?.map((sub: any) => (
                  <div key={sub.id} className="mt-2 ml-2">
                    <h4 className="text-sm font-medium text-muted-foreground">{sub.title}</h4>
                    <ul className="mt-1 space-y-1">
                      {sub.lessons?.map((lesson: any) => (
                        <li key={lesson.id}>
                          <Link 
                            href={`/learn/${course.slug}/lessons/${lesson.id}`}
                            className="block rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted"
                          >
                            {lesson.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 bg-background h-screen overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
