import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import { env } from '@/env';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Phone, Calendar, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { PayoutForm } from './payout-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function InstructorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const supabaseAdmin = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Ensure admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'admin') redirect('/login');

  // Fetch instructor details
  const { data: instructor } = await supabaseAdmin
    .from('admin_staff_profiles_view')
    .select('*')
    .eq('id', id)
    .single();

  if (!instructor) {
    notFound();
  }

  // Fetch assigned courses
  const { data: assignedCourses } = await supabaseAdmin
    .from('instructor_assignments')
    .select(`
      course_id,
      created_at,
      courses (
        id,
        title,
        status,
        price_amount,
        type
      )
    `)
    .eq('instructor_id', id)
    .order('created_at', { ascending: false });

  // Fetch courses they created themselves
  const { data: createdCourses } = await supabaseAdmin
    .from('courses')
    .select('id, title, status, price_amount, type, created_at')
    .eq('created_by', id)
    .order('created_at', { ascending: false });

  // Merge the lists to get unique courses they are involved in
  const uniqueCourseMap = new Map();
  createdCourses?.forEach(c => uniqueCourseMap.set(c.id, { ...c, relation: 'Creator' }));
  assignedCourses?.forEach(a => {
    const c = Array.isArray(a.courses) ? a.courses[0] : a.courses;
    if (c) {
      if (uniqueCourseMap.has(c.id)) {
        uniqueCourseMap.set(c.id, { ...uniqueCourseMap.get(c.id), relation: 'Creator & Assigned' });
      } else {
        uniqueCourseMap.set(c.id, { ...c, relation: 'Assigned Co-Instructor' });
      }
    }
  });

  const courses = Array.from(uniqueCourseMap.values());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/instructors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Staff Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Identity Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="w-24 h-24 border-4 border-background shadow-sm">
              <AvatarImage src={instructor.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {instructor.full_name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-xl font-bold">{instructor.full_name}</h2>
              <div className="flex justify-center items-center gap-2 mt-2">
                <Badge variant={instructor.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                  {instructor.role}
                </Badge>
                <Badge variant={instructor.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                  {instructor.status}
                </Badge>
              </div>
            </div>

            <div className="w-full space-y-3 pt-4 border-t text-sm text-left">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${instructor.email}`} className="hover:text-primary">{instructor.email}</a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{instructor.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(instructor.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payout & Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Platform Revenue Share</CardTitle>
            <CardDescription>Adjust the percentage of revenue this instructor receives for courses they teach.</CardDescription>
          </CardHeader>
          <CardContent>
            <PayoutForm instructorId={id} currentPayout={instructor.payout_percentage} />
          </CardContent>
        </Card>

        {/* Courses List */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Course Portfolio
            </CardTitle>
            <CardDescription>Courses this instructor created or is assigned to teach.</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                This instructor is not assigned to any courses yet.
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium text-muted-foreground border-b">
                  <div className="col-span-5">Course Title</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>
                <div className="divide-y">
                  {courses.map(course => (
                    <div key={course.id} className="grid grid-cols-12 p-3 text-sm items-center hover:bg-muted/20 transition-colors">
                      <div className="col-span-5 font-medium truncate pr-4">
                        <Link href={`/admin/courses/${course.id}`} className="hover:underline hover:text-primary">
                          {course.title}
                        </Link>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-[10px]">{course.relation}</Badge>
                      </div>
                      <div className="col-span-2 capitalize text-muted-foreground">
                        {course.type.replace('_', ' ')}
                      </div>
                      <div className="col-span-2">
                        Tk {course.price_amount}
                      </div>
                      <div className="col-span-1 text-right">
                        <Badge variant={course.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                          {course.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
