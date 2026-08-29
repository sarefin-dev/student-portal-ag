import { createClient } from '@/lib/supabase/server';
import { CohortCompletionManager } from './cohort-completion-manager';
import { notFound } from 'next/navigation';

export default async function CohortCompletionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch course (must be cohort-type)
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, type, instructor_controlled_completion')
    .eq('id', id)
    .single();

  if (!course || !['live_cohort', 'in_person'].includes(course.type)) {
    notFound();
  }

  // Fetch all active enrollments with student info and progress
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      completion_percent,
      completed_at,
      enrolled_at,
      profiles!enrollments_student_id_fkey (
        id, full_name, email, avatar_url
      )
    `)
    .eq('course_id', id)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: true });

  // Fetch certificates issued for this course to show badge
  const { data: certificates } = await supabase
    .from('certificates')
    .select('student_id, issued_at, verify_code')
    .eq('course_id', id);

  const certMap = new Map(certificates?.map((c) => [c.student_id, c]) ?? []);

  const enriched = (enrollments ?? []).map((e: any) => ({
    ...e,
    certificate: certMap.get(e.profiles?.id) ?? null,
  }));

  return (
    <CohortCompletionManager
      courseId={id}
      courseTitle={course.title}
      instructorControlled={course.instructor_controlled_completion}
      enrollments={enriched}
    />
  );
}
