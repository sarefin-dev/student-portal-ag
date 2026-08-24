import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Menu, ArrowLeft, CheckCircle2, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
              <div className="flex flex-col mb-1 gap-1.5">
                <h3 className="font-semibold leading-tight">{mod.title}</h3>
                {mod.guest_instructor_id && mod.profiles && (
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-5 h-5 border">
                      <AvatarImage src={mod.profiles.avatar_url} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {mod.profiles.full_name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-muted-foreground">Guest: {mod.profiles.full_name}</span>
                  </div>
                )}
              </div>
              {mod.submodules?.map((sub: any) => (
                <div key={sub.id} className="mt-2 ml-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{sub.title}</h4>
                  <ul className="mt-1 space-y-1">
                    {sub.lessons?.map((lesson: any) => (
                      <li key={lesson.id}>
                        <Link 
                          href={`/learn/${course.slug}/lessons/${lesson.id}`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                        >
                          <span>{lesson.title}</span>
                          {lesson.is_completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
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
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch course hierarchy and progress concurrently
  const [courseRes, progressRes] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        id, title, slug,
        modules (
          id, title, position, guest_instructor_id, profiles(full_name, avatar_url),
          submodules (
            id, title, position,
            lessons (
              id, title, position,
              content_blocks (id)
            )
          )
        )
      `)
      .eq('slug', slug)
      .single(),
    user ? supabase
      .from('block_progress')
      .select('content_block_id, status')
      .eq('student_id', user.id)
      .eq('status', 'completed') : Promise.resolve({ data: [] })
  ]);

  const course = courseRes.data;
  if (!course) notFound();

  const progressData = progressRes.data;
  const completedBlockIds = new Set(progressData?.map(p => p.content_block_id) || []);

  // Sort modules
  course.modules?.sort((a: any, b: any) => a.position - b.position);
  course.modules?.forEach((m: any) => {
    m.submodules?.sort((a: any, b: any) => a.position - b.position);
    m.submodules?.forEach((s: any) => {
      s.lessons?.sort((a: any, b: any) => a.position - b.position);
      // Determine lesson completion: true if all blocks are completed, and there is at least one block
      s.lessons?.forEach((l: any) => {
        const totalBlocks = l.content_blocks?.length || 0;
        const completedBlocks = l.content_blocks?.filter((b: any) => completedBlockIds.has(b.id)).length || 0;
        l.is_completed = totalBlocks > 0 && totalBlocks === completedBlocks;
      });
    });
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
