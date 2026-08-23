'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinWaitlist } from './actions';

export function WaitlistForm({ courseId, slug }: { courseId: string; slug: string }) {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      await joinWaitlist(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-primary/10 p-4 text-primary border border-primary/20 mb-4 text-center sm:text-left">
        <h3 className="font-semibold text-xl">You're on the list! ✅</h3>
        <p>We'll notify you via email as soon as enrollment opens.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-primary/10 p-6 text-primary border border-primary/20 mb-4 text-center sm:text-left">
      <h3 className="font-semibold text-xl mb-2">Coming Soon!</h3>
      <p className="mb-4">Enrollment for this course will open soon. Join the waitlist to get early access.</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="slug" value={slug} />
        <Input 
          type="email" 
          name="email" 
          placeholder="Enter your email address" 
          required 
          className="bg-background"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Joining...' : 'Notify Me'}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
