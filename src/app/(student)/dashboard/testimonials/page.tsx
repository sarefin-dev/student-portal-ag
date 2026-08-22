import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TestimonialForm } from './testimonial-form';

export default async function StudentTestimonialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get enrolled courses for the dropdown
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, courses(title)')
    .eq('student_id', user!.id);

  // Get their past testimonials
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('student_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Testimonials</h1>
        <p className="text-muted-foreground">Share your experience with others.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <TestimonialForm courses={enrollments?.map(e => ({ id: e.course_id, title: (e.courses as any).title })) || []} />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Past Submissions</h2>
          {testimonials?.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < t.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                    ))}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                    t.status === 'approved' ? 'bg-success/10 text-success' :
                    t.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-sm italic text-muted-foreground">"{t.content}"</p>
              </CardContent>
            </Card>
          ))}
          {(!testimonials || testimonials.length === 0) && (
            <p className="text-sm text-muted-foreground">You haven't submitted any testimonials yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
