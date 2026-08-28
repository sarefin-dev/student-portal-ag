'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

import { sendEnrollmentNotification } from '@/lib/email';

export async function manualEnroll(formData: FormData) {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const courseId = formData.get('courseId') as string;

  if (!email || !courseId) return { success: false, error: "Missing required fields" };

  const supabase = await createClient();

  // Find student and course
  const [{ data: student }, { data: course }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role').eq('email', email).maybeSingle(),
    supabase.from('courses').select('id, title, slug, status').eq('id', courseId).maybeSingle()
  ]);

  if (!student) {
    return { success: false, error: "Student not found with this email" };
  }

  if (!course) {
    return { success: false, error: "Course not found" };
  }

  if (course.status !== 'active') {
    return { success: false, error: `Cannot enroll into a ${course.status} course. Publish the course first before enrolling students.` };
  }

  // Insert enrollment
  const { error } = await supabase
    .from('enrollments')
    .insert({
      student_id: student.id,
      course_id: courseId,
      source: 'admin',
      status: 'active'
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: "Student is already enrolled in this course" };
    return { success: false, error: error.message };
  }

  // Automatically dispatch notification + email
  await sendEnrollmentNotification({
    studentId: student.id,
    studentEmail: student.email,
    studentName: student.full_name,
    courseTitle: course.title,
    courseSlug: course.slug,
  });

  revalidatePath('/admin/enroll-manual');
  revalidatePath('/admin/enrollments');
  return { success: true };
}
