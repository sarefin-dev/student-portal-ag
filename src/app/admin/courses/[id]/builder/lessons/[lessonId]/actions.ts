'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function addTextBlock(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const lessonId = formData.get('lessonId') as string;
  const markdown = formData.get('markdown') as string;

  const { data: existing } = await supabase
    .from('content_blocks')
    .select('position')
    .eq('lesson_id', lessonId)
    .order('position', { ascending: false })
    .limit(1);

  const newPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

  const { error } = await supabase
    .from('content_blocks')
    .insert({
      lesson_id: lessonId,
      block_type: 'text',
      position: newPosition,
      payload: { content_markdown: markdown }
    });

  if (error) console.error("Error adding text block:", error);

  revalidatePath(`/admin/courses/${courseId}/builder/lessons/${lessonId}`);
  revalidatePath(`/learn/${courseId}`);
}

export async function removeBlock(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const lessonId = formData.get('lessonId') as string;
  const blockId = formData.get('blockId') as string;

  await supabase.from('content_blocks').delete().eq('id', blockId);
  revalidatePath(`/admin/courses/${courseId}/builder/lessons/${lessonId}`);
}

export async function moveBlock(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const lessonId = formData.get('lessonId') as string;
  const blockId = formData.get('blockId') as string;
  const direction = formData.get('direction') as 'up' | 'down';

  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('id, position')
    .eq('lesson_id', lessonId)
    .order('position', { ascending: true });
    
  if (!blocks || blocks.length < 2) return;

  const currentIndex = blocks.findIndex(b => b.id === blockId);
  if (currentIndex === -1) return;
  if (direction === 'up' && currentIndex === 0) return;
  if (direction === 'down' && currentIndex === blocks.length - 1) return;

  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const currentBlock = blocks[currentIndex];
  const swapBlock = blocks[swapIndex];

  // Perform swap using individual updates
  await supabase.from('content_blocks').update({ position: swapBlock.position }).eq('id', currentBlock.id);
  await supabase.from('content_blocks').update({ position: currentBlock.position }).eq('id', swapBlock.id);

  revalidatePath(`/admin/courses/${courseId}/builder/lessons/${lessonId}`);
}

export async function addVideoBlock(formData: FormData) {
  const { supabase } = await requireAuth();
  const courseId = formData.get('courseId') as string;
  const lessonId = formData.get('lessonId') as string;
  const videoId = formData.get('videoId') as string; // UUID of a row in videos table

  const { data: existing } = await supabase
    .from('content_blocks')
    .select('position')
    .eq('lesson_id', lessonId)
    .order('position', { ascending: false })
    .limit(1);

  const newPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

  const { error } = await supabase
    .from('content_blocks')
    .insert({
      lesson_id: lessonId,
      block_type: 'video',
      position: newPosition,
      payload: { video_id: videoId }
    });

  if (error) console.error("Error adding video block:", error);

  revalidatePath(`/admin/courses/${courseId}/builder/lessons/${lessonId}`);
}
