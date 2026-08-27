import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addTextBlock, addVideoBlock, addYoutubeBlock, addResourceBlock, moveBlock, removeBlock } from './actions';
import { ArrowDown, ArrowUp, Trash2, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default async function LessonBuilderPage({ params }: { params: Promise<{ id: string, lessonId: string }> }) {
  const { id: courseId, lessonId } = await params;
  const supabase = await createClient();

  // Fetch lesson and content blocks
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      *,
      content_blocks (
        id, block_type, position, payload
      )
    `)
    .eq('id', lessonId)
    .single();

  if (!lesson) notFound();

  // Sort blocks
  lesson.content_blocks?.sort((a: any, b: any) => a.position - b.position);

  // For the video dropdown, let's just fetch available videos
  const { data: videos } = await supabase.from('videos').select('id, bunny_video_guid').limit(50);
  // Fetch available resources/eBooks
  const { data: resources } = await supabase.from('resources').select('id, title, type').is('deleted_at', null).order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex h-14 items-center border-b pb-4 mb-6">
        <Link href={`/admin/courses/${courseId}/builder`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to Course Builder
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Lesson: {lesson.title}</h1>
          <p className="text-muted-foreground">Add and arrange content blocks.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Content Blocks List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Content Blocks</h2>
          {(!lesson.content_blocks || lesson.content_blocks.length === 0) ? (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              No content blocks yet. Add text, video, or downloadable resources from the sidebar.
            </div>
          ) : (
            <div className="space-y-4">
              <TooltipProvider>
                {lesson.content_blocks.map((block: any, index: number) => (
                  <div key={block.id} className="rounded-lg border bg-card p-4 shadow-sm flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize mb-2">
                        {block.block_type}
                      </span>
                      {block.block_type === 'text' && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {block.payload.content_markdown}
                        </p>
                      )}
                      {block.block_type === 'video' && (
                        <p className="text-sm font-mono text-muted-foreground">
                          Video: {block.payload.youtube_url || block.payload.video_id}
                        </p>
                      )}
                      {block.block_type === 'file' && (
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span>{block.payload.file_name || 'Attached File'}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <form action={moveBlock}>
                        <input type="hidden" name="courseId" value={courseId} />
                        <input type="hidden" name="lessonId" value={lessonId} />
                        <input type="hidden" name="blockId" value={block.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" type="submit" disabled={index === 0} className="h-8 w-8">
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move Up</TooltipContent>
                        </Tooltip>
                      </form>

                      <form action={moveBlock}>
                        <input type="hidden" name="courseId" value={courseId} />
                        <input type="hidden" name="lessonId" value={lessonId} />
                        <input type="hidden" name="blockId" value={block.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" type="submit" disabled={index === lesson.content_blocks.length - 1} className="h-8 w-8">
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move Down</TooltipContent>
                        </Tooltip>
                      </form>

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove Block</span>
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Remove Block</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Block?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this {block.block_type} block? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <form action={removeBlock}>
                              <input type="hidden" name="courseId" value={courseId} />
                              <input type="hidden" name="lessonId" value={lessonId} />
                              <input type="hidden" name="blockId" value={block.id} />
                              <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full">
                                Confirm Deletion
                              </AlertDialogAction>
                            </form>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Add Blocks Panel */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Add Text Block</h3>
            <form action={addTextBlock} className="space-y-3">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="lessonId" value={lessonId} />
              <textarea 
                name="markdown" 
                required 
                rows={4}
                placeholder="Enter markdown text..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              ></textarea>
              <Button type="submit" className="w-full">Add Text</Button>
            </form>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Add Video Block</h3>
            <form action={addVideoBlock} className="space-y-3">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="lessonId" value={lessonId} />
              {(!videos || videos.length === 0) ? (
                <p className="text-xs text-muted-foreground">No videos uploaded to the library yet. <br/>(Simulate by pasting a UUID)</p>
              ) : (
                <select name="videoId" className="w-full rounded-md border border-input px-3 py-2 text-sm">
                  {videos.map(v => (
                    <option key={v.id} value={v.id}>{v.bunny_video_guid}</option>
                  ))}
                </select>
              )}
              {(!videos || videos.length === 0) && (
                <Input name="videoId" placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000" required />
              )}
              <Button type="submit" variant="secondary" className="w-full">Attach Video</Button>
            </form>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Add YouTube Video</h3>
            <form action={addYoutubeBlock} className="space-y-3">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="lessonId" value={lessonId} />
              <Input name="youtubeUrl" placeholder="e.g. https://youtube.com/watch?v=..." required />
              <Button type="submit" variant="secondary" className="w-full">Embed YouTube Video</Button>
            </form>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Attach eBook / Resource</h3>
            {(!resources || resources.length === 0) ? (
              <div className="text-xs text-muted-foreground space-y-2">
                <p>No resources uploaded yet.</p>
                <Link href="/admin/resources" className="text-primary hover:underline font-medium block">
                  + Upload an eBook / Resource first
                </Link>
              </div>
            ) : (
              <form action={addResourceBlock} className="space-y-3">
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="lessonId" value={lessonId} />
                <select name="resourceId" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.type.toUpperCase()}] {r.title}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="secondary" className="w-full">Attach to Lesson</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
