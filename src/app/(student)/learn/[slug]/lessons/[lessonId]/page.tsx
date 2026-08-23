import { getLessonWithBlocks } from '@/db/queries/courses';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { AssessmentTaker } from './assessment-taker';
import { env } from '@/env';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

export default async function LessonPage({ params }: { params: Promise<{ slug: string, lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();
  const lesson = await getLessonWithBlocks(supabase, lessonId).catch(() => null);

  if (!lesson) notFound();

  const blockIds = lesson.content_blocks?.map((b: any) => b.id) || [];
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*, assessment_questions(*)')
    .eq('lesson_id', lessonId)
    .single();

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="mx-auto max-w-[720px] space-y-8">
          <h1 className="text-3xl font-bold">{lesson.title}</h1>

          {(!lesson.content_blocks || lesson.content_blocks.length === 0) ? (
            <p className="text-muted-foreground">This lesson is currently empty.</p>
          ) : (
            <div className="space-y-12">
              {lesson.content_blocks.map((block: any) => {
                const payload = block.payload;

                if (block.block_type === 'video') {
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
                  return (
                    <div key={block.id} className="rounded border p-4 flex items-center justify-between bg-muted/50 shadow-none">
                      <div>
                        <h4 className="font-semibold">{payload.file_name}</h4>
                        <p className="text-xs text-muted-foreground">{payload.mime_type}</p>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
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
        <Button variant="outline" disabled>Previous Lesson</Button>
        <form action={async () => {
          'use server';
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (blockIds.length > 0) {
            const payloads = blockIds.map((id: string) => ({
              student_id: user!.id,
              content_block_id: id,
              status: 'completed'
            }));
            
            const { error } = await supabase
              .from('block_progress')
              .upsert(payloads, { onConflict: 'student_id,content_block_id' });
              
            if (error) console.error("Error marking complete:", error);
          }
            
          revalidatePath(`/learn/${slug}`);
          redirect(`/learn/${slug}`);
        }}>
          <Button type="submit">Mark Complete & Continue</Button>
        </form>
      </div>
    </div>
  );
}
