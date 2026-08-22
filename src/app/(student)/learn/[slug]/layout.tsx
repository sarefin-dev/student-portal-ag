import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Menu, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

function SyllabusContent({ course }: { course: any }) {
  return (
    <>
      <div className="flex h-14 items-center border-b px-4 shrink-0 bg-sidebar/50 backdrop-blur">
        <Link href="/dashboard" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
      </div>
      
      <div className="p-4 border-b shrink-0">
        <h2 className="text-lg font-bold">{course.title}</h2>
      </div>

      <div className="px-4 py-2 border-b shrink-0">
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
                          className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
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
    </>
  );
}

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
    <div className="flex flex-col md:flex-row min-h-[100dvh]">
      {/* Mobile Top Bar (Syllabus Trigger) */}
      <div className="md:hidden flex h-14 items-center border-b bg-background px-4 z-10 shrink-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5 mr-2" /> Syllabus
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[350px] p-0 flex flex-col">
            <SheetTitle className="sr-only">Syllabus</SheetTitle>
            <SyllabusContent course={course} />
          </SheetContent>
        </Sheet>
        <span className="font-semibold text-sm truncate flex-1 text-right">{course.title}</span>
      </div>

      {/* Desktop Syllabus Sidebar */}
      <aside className="hidden md:flex w-80 border-r bg-muted/10 flex-col h-[100dvh] shrink-0 sticky top-0">
        <SyllabusContent course={course} />
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 bg-background h-[calc(100dvh-3.5rem)] md:h-[100dvh] overflow-y-auto relative flex flex-col">
        {children}
      </main>
    </div>
  );
}
