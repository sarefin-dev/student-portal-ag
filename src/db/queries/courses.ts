import { SupabaseClient } from '@supabase/supabase-js';

// Retrieve all active courses for the public catalog
export async function getActiveCourses(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      description,
      type,
      thumbnail_url,
      price_amount,
      compare_at_price,
      currency
    `)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Retrieve a single course by slug for the course detail page
export async function getCourseBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        title,
        position,
        submodules (
          id,
          title,
          position,
          lessons (
            id,
            title,
            position,
            is_preview
          )
        )
      )
    `)
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  // Sort modules, submodules, and lessons by position
  if (data?.modules) {
    data.modules.sort((a: any, b: any) => a.position - b.position);
    data.modules.forEach((mod: any) => {
      if (mod.submodules) {
        mod.submodules.sort((a: any, b: any) => a.position - b.position);
        mod.submodules.forEach((sub: any) => {
          if (sub.lessons) {
            sub.lessons.sort((a: any, b: any) => a.position - b.position);
          }
        });
      }
    });
  }

  return data;
}

// Retrieve full lesson details including content blocks
export async function getLessonWithBlocks(supabase: SupabaseClient, lessonId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      content_blocks (
        id,
        block_type,
        position,
        payload
      )
    `)
    .eq('id', lessonId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  if (data?.content_blocks) {
    data.content_blocks.sort((a: any, b: any) => a.position - b.position);
  }

  return data;
}
