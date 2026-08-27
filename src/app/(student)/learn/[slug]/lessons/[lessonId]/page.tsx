import { getLessonWithBlocks } from '@/db/queries/courses';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Download, FileText } from 'lucide-react';
import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { NavigationButton } from '@/components/ui/navigation-button';
import { AssessmentTaker } from './assessment-taker';
import { env } from '@/env';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { AiTutorChat } from '@/components/ai-tutor-chat';

export default async function LessonPage({ params }: { params: Promise<{ slug: string, lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();
  
  // Parallel fetch independent data
  const [lesson, assessmentRes, courseRes, userRes] = await Promise.all([
    getLessonWithBlocks(supabase, lessonId).catch(() => null),
    supabase.from('assessments').select('*, assessment_questions(*)').eq('lesson_id', lessonId).maybeSingle(),
    supabase.from('courses').select(`modules (position, submodules (position, lessons (id, title, position)))`).eq('slug', slug).single(),
    supabase.auth.getUser()
  ]);

  if (!lesson) notFound();

  const blockIds = lesson.content_blocks?.map((b: any) => b.id) || [];
  const assessment = assessmentRes.data;
  const course = courseRes.data;
  const user = userRes.data.user;

  let allLessons: { id: string, title: string }[] = [];
  if (course?.modules) {
    course.modules.sort((a: any, b: any) => a.position - b.position);
    course.modules.forEach((m: any) => {
      m.submodules?.sort((a: any, b: any) => a.position - b.position);
      m.submodules?.forEach((s: any) => {
        s.lessons?.sort((a: any, b: any) => a.position - b.position);
        s.lessons?.forEach((l: any) => {
          allLessons.push({ id: l.id, title: l.title });
        });
      });
    });
  }

  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Check if lesson is completed
  let isLessonCompleted = false;
  if (user && blockIds.length > 0) {
    const { data: progress } = await supabase
      .from('block_progress')
      .select('content_block_id')
      .eq('student_id', user.id)
      .eq('status', 'completed');
      
    if (progress && progress.length === blockIds.length) {
      isLessonCompleted = true;
    }
  }

  // Calculate context for AI Tutor
  const lessonContext = lesson.content_blocks?.map((b: any) => {
    if (b.block_type === 'text') return b.payload.content_markdown || '';
    if (b.block_type === 'video') return 'Video Lesson. ' + (b.payload.description || '');
    return '';
  }).join('\n\n') || '';

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="mx-auto max-w-[720px] space-y-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{lesson.title}</h1>
            {isLessonCompleted && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </span>
            )}
          </div>

          {(!lesson.content_blocks || lesson.content_blocks.length === 0) ? (
            <p className="text-muted-foreground">This lesson is currently empty.</p>
          ) : (
            <div className="space-y-12">
              {lesson.content_blocks.map((block: any) => {
                const payload = block.payload;

                if (block.block_type === 'video') {
                  if (payload.youtube_url) {
                    const ytIdMatch = payload.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                    const ytId = ytIdMatch ? ytIdMatch[1] : null;

                    return (
                      <div key={block.id} className="overflow-hidden rounded border shadow-none aspect-video bg-black">
                        {ytId ? (
                           <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        ) : (
                           <div className="p-4 bg-red-100 text-red-700">Invalid YouTube URL</div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={block.id} className="overflow-hidden rounded border bg-black shadow-none">
                      <VideoPlayer videoId={payload.video_id} blockId={block.id} hostname={env.BUNNY_STREAM_CDN_HOSTNAME} />
                    </div>
                  );
                }

                if (block.block_type === 'text') {
                  return (
                    <MarkdownRenderer key={block.id} content={payload.content_markdown || ''} />
                  );
                }

                if (block.block_type === 'file') {
                  const downloadUrl = payload.resource_id 
                    ? `/api/resources/${payload.resource_id}/download`
                    : payload.url || '#';

                  return (
                    <div key={block.id} className="rounded-lg border p-4 flex items-center justify-between bg-card shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{payload.file_name || 'Downloadable Resource'}</h4>
                          <p className="text-xs text-muted-foreground">{payload.mime_type || 'PDF Document'}</p>
                        </div>
                      </div>
                      <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" /> Download
                        </Button>
                      </a>
                    </div>
                  );
                }

                return (
                  <div key={block.id} className="p-4 border border-dashed text-center text-muted-foreground">
                    Unsupported block type: {block.block_type}
                  </div>
                );
              })}
            </div>
          )}

          {/* Assessment Section */}
          {assessment && (
            <AssessmentTaker assessment={assessment} courseId={lesson.submodules?.modules?.course_id || slug} />
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="border-t bg-background p-4 flex items-center justify-between fixed bottom-0 left-0 right-0 md:left-[300px]">
        {prevLesson ? (
          <NavigationButton href={`/learn/${slug}/lessons/${prevLesson.id}`} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous Lesson
          </NavigationButton>
        ) : <div />}
        
        <div className="flex items-center gap-2">
          {isLessonCompleted && (
            <form action={async () => {
              'use server';
              const supabase = await createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (blockIds.length > 0) {
                await supabase.from('block_progress').delete().eq('student_id', user?.id).in('content_block_id', blockIds);
              }
              revalidatePath(`/learn/${slug}/lessons/${lessonId}`);
            }}>
              <SubmitButton variant="outline" size="icon" title="Reset Progress" className="text-muted-foreground">
                <RotateCcw className="w-4 h-4" />
              </SubmitButton>
            </form>
          )}

          <form action={async () => {
            'use server';
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            // Mark all blocks in this lesson as completed
            if (blockIds.length > 0) {
              const upserts = blockIds.map((id: string) => ({
                student_id: user?.id,
                content_block_id: id,
                status: 'completed'
              }));
              await supabase.from('block_progress').upsert(upserts, { onConflict: 'student_id, content_block_id' });
            }
            revalidatePath(`/learn/${slug}/lessons/${lessonId}`);
            if (nextLesson) {
              redirect(`/learn/${slug}/lessons/${nextLesson.id}`);
            }
          }}>
            {isLessonCompleted ? (
              <Button type="button" variant="secondary" disabled className="text-green-600 bg-green-500/10 hover:bg-green-500/10 opacity-100 border-none cursor-default">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Completed
              </Button>
            ) : (
              <SubmitButton variant="secondary" pendingText="Marking...">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
              </SubmitButton>
            )}
          </form>

          {nextLesson ? (
            <NavigationButton href={`/learn/${slug}/lessons/${nextLesson.id}`} variant="default">
              Next Lesson <ChevronRight className="w-4 h-4 ml-2" />
            </NavigationButton>
          ) : <div />}
        </div>
      </div>

      <AiTutorChat lessonContext={lessonContext} lessonId={lessonId} />
    </div>
  );
}
