'use client';

import { Button } from '@/components/ui/button';
import { approveTestimonial, rejectTestimonial } from './actions';
import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

export function TestimonialActions({ id, status }: { id: string, status: string }) {
  const [isPending, setIsPending] = useState(false);

  if (status !== 'pending') return null;

  return (
    <div className="flex gap-2 shrink-0">
      <Button variant="outline" size="sm" className="text-success hover:text-success hover:bg-success/10" disabled={isPending} onClick={async () => {
        setIsPending(true);
        await approveTestimonial(id);
        setIsPending(false);
      }}>
        <CheckCircle className="w-4 h-4 mr-2" /> Approve
      </Button>
      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isPending} onClick={async () => {
        setIsPending(true);
        await rejectTestimonial(id);
        setIsPending(false);
      }}>
        <XCircle className="w-4 h-4 mr-2" /> Reject
      </Button>
    </div>
  );
}
