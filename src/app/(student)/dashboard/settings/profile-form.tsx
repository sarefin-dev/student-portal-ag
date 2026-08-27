'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateStudentProfile } from './actions';
import { toast } from 'sonner';

export function StudentProfileForm({ profile }: { profile: any }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateStudentProfile(formData);
    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Profile information updated successfully!');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email" 
          value={profile?.email || ''} 
          disabled 
          className="bg-muted cursor-not-allowed" 
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input 
          id="full_name" 
          name="full_name" 
          defaultValue={profile?.full_name || ''} 
          required 
          placeholder="e.g. Sadot Arefin"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone / WhatsApp Number</Label>
        <Input 
          id="phone" 
          name="phone" 
          defaultValue={profile?.phone || ''} 
          placeholder="e.g. +8801700000000"
        />
        <p className="text-xs text-muted-foreground">Used for live cohort WhatsApp groups and class updates.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input 
          id="address" 
          name="address" 
          defaultValue={profile?.address || ''} 
          placeholder="e.g. Dhaka, Bangladesh"
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
