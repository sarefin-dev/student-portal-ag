import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { TestimonialActions } from './testimonial-actions';
import { MessageSquareQuote } from 'lucide-react';

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();

  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*, profiles(full_name, email)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Testimonials</h1>
        <p className="text-muted-foreground">Approve student reviews to display on the public storefront.</p>
      </div>

      <div className="space-y-4">
        {testimonials?.map(t => (
          <Card key={t.id} className={t.status === 'pending' ? 'border-l-4 border-l-warning' : ''}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{t.profiles?.full_name || 'Unknown Student'}</h3>
                  <span className="text-sm text-muted-foreground">({t.profiles?.email})</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                    t.status === 'approved' ? 'bg-success/10 text-success' :
                    t.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="flex gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < t.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                  ))}
                </div>
                <p className="text-sm italic border-l-2 pl-3 py-1 bg-muted/30">"{t.content}"</p>
                
                {t.course_id && <p className="text-xs text-muted-foreground mt-2">Course ID: {t.course_id}</p>}
              </div>

              <TestimonialActions id={t.id} status={t.status} />
            </CardContent>
          </Card>
        ))}

        {(!testimonials || testimonials.length === 0) && (
          <div className="text-center p-12 border rounded-lg bg-muted/30">
            <MessageSquareQuote className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Testimonials</h3>
            <p className="text-muted-foreground">When students submit reviews, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
