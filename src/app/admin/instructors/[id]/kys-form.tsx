'use client';

import { useState } from 'react';
import { updateKysAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function KysForm({ instructor }: { instructor: any }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  async function onSubmit(formData: FormData) {
    setIsPending(true);
    setMessage({ text: '', type: '' });
    const { error } = await updateKysAction(instructor.id, formData);
    setIsPending(false);

    if (error) {
      setMessage({ text: error, type: 'error' });
    } else {
      setMessage({ text: 'KYS profile updated successfully.', type: 'success' });
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Physical Address</Label>
          <Textarea id="address" name="address" defaultValue={instructor.address || ''} placeholder="Full address..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Short Bio</Label>
          <Textarea id="bio" name="bio" defaultValue={instructor.bio || ''} placeholder="Brief biography..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nid_number">NID / Social Proof Number</Label>
          <Input id="nid_number" name="nid_number" defaultValue={instructor.nid_number || ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expertise">Expertise</Label>
          <Input id="expertise" name="expertise" defaultValue={instructor.expertise || ''} placeholder="e.g. React, Node.js" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interests">Interests</Label>
          <Input id="interests" name="interests" defaultValue={instructor.interests || ''} placeholder="e.g. AI, Open Source" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <Label htmlFor="social_fb">Facebook Profile (URL)</Label>
          <Input id="social_fb" name="social_fb" type="url" defaultValue={instructor.social_fb || ''} placeholder="https://facebook.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_x">X / Twitter (URL)</Label>
          <Input id="social_x" name="social_x" type="url" defaultValue={instructor.social_x || ''} placeholder="https://x.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_linkedin">LinkedIn (URL)</Label>
          <Input id="social_linkedin" name="social_linkedin" type="url" defaultValue={instructor.social_linkedin || ''} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_github">GitHub (URL)</Label>
          <Input id="social_github" name="social_github" type="url" defaultValue={instructor.social_github || ''} placeholder="https://github.com/..." />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div>
          {message.text && (
            <p className={message.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-success'}>
              {message.text}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save KYS Profile'}
        </Button>
      </div>
    </form>
  );
}
