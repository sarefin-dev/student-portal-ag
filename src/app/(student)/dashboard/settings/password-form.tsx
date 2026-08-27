'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword } from './actions';
import { toast } from 'sonner';

export function PasswordChangeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await updatePassword(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Password changed successfully!');
        formRef.current?.reset();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="new_password">New Password</Label>
        <Input id="new_password" name="new_password" type="password" required minLength={6} placeholder="Minimum 6 characters" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm New Password</Label>
        <Input id="confirm_password" name="confirm_password" type="password" required minLength={6} placeholder="Repeat new password" />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}
