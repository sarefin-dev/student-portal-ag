'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitTestimonial } from './actions';
import { Star } from 'lucide-react';

export function TestimonialForm({ courses }: { courses: {id: string, title: string}[] }) {
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append('rating', rating.toString());
    
    const res = await submitTestimonial(formData);
    setIsSubmitting(false);
    
    if (res.success) {
      alert("Thank you! Your testimonial is pending review.");
      e.currentTarget.reset();
      setRating(5);
    } else {
      alert(res.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Tell us what you think.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 ${star <= rating ? 'text-primary' : 'text-muted-foreground opacity-30'}`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Course (Optional)</Label>
            <select name="courseId" className="w-full p-2 border rounded-md bg-background text-sm">
              <option value="">General Review</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Your Feedback</Label>
            <Textarea name="content" required placeholder="How was your experience?" className="h-32 resize-none" />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
