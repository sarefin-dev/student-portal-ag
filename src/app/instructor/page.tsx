import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';

export default async function InstructorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch real counts for this instructor
  const { count: courseCount } = await supabase
    .from('instructor_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('instructor_id', user.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, instructor_title')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Instructor'}!</h1>
      </div>

      <p className="text-muted-foreground">Manage your assigned courses, learning resources, and profile from this portal.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">My Courses</p>
              <h3 className="text-2xl font-bold">{courseCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 mt-4">
            <Link href="/instructor/courses" className="block w-full p-3 rounded bg-muted/50 hover:bg-muted font-medium transition-colors">
              Manage Course Content & Assessments
            </Link>
            <Link href="/instructor/resources" className="block w-full p-3 rounded bg-muted/50 hover:bg-muted font-medium transition-colors">
              Upload Learning Resources
            </Link>
            <Link href="/instructor/settings" className="block w-full p-3 rounded bg-muted/50 hover:bg-muted font-medium transition-colors">
              Update Digital Signature
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
