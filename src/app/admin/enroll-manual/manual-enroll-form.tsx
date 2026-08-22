'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { manualEnroll } from './actions';
import { UserPlus } from 'lucide-react';

export function ManualEnrollForm({ courses }: { courses: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await manualEnroll(formData);
    setIsSubmitting(false);
    if (res.success) {
      alert("Successfully enrolled student!");
      e.currentTarget.reset();
    } else {
      alert(res.error);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> Enroll on Behalf
        </CardTitle>
        <CardDescription>Grant immediate course access without requiring payment.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student Email</Label>
            <Input name="email" type="email" required placeholder="student@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <select name="courseId" className="w-full p-2 border rounded-md bg-background text-sm" required>
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enrolling...' : 'Grant Access'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
