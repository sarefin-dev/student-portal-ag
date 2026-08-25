'use client';

import { useState } from 'react';
import { updateKysAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function KysForm({ instructor }: { instructor: any }) {
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(instructor.avatar_url || '');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createClient();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${instructor.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from('public_media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('public_media')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrlData.publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
    <form action={onSubmit} className="space-y-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-32 h-32 border-4 border-background shadow-sm">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
              {instructor.full_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="w-full max-w-[200px]">
            <Label htmlFor="photo" className="sr-only">Profile Photo</Label>
            <Input 
              id="photo" 
              type="file" 
              accept="image/*" 
              onChange={handleUpload}
              disabled={isUploading}
              className="text-xs"
            />
            {isUploading && <p className="text-xs text-muted-foreground mt-1 text-center">Uploading...</p>}
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" defaultValue={instructor.full_name || ''} placeholder="Instructor Name" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Textarea id="address" name="address" defaultValue={instructor.address || ''} placeholder="Full address..." className="h-24" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea id="bio" name="bio" defaultValue={instructor.bio || ''} placeholder="Brief biography..." className="h-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={instructor.phone || ''} placeholder="+880..." />
            </div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <Label htmlFor="social_fb">Facebook (URL)</Label>
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

      <div className="pt-4 border-t space-y-4">
        <h3 className="text-sm font-semibold">Payout Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payout_method">Preferred Payout Method</Label>
            <select 
              id="payout_method" 
              name="payout_method" 
              defaultValue={instructor.payout_method || ''} 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select Method...</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="bank">Bank Account</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payout_bkash">bKash Number</Label>
            <Input id="payout_bkash" name="payout_bkash" defaultValue={instructor.payout_bkash || ''} placeholder="e.g. 017..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payout_nagad">Nagad Number</Label>
            <Input id="payout_nagad" name="payout_nagad" defaultValue={instructor.payout_nagad || ''} placeholder="e.g. 017..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payout_bank">Bank Account Details</Label>
            <Input id="payout_bank" name="payout_bank" defaultValue={instructor.payout_bank || ''} placeholder="Bank Name, Acct No, Branch" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {message.text && (
            <p className={message.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-success'}>
              {message.text}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isPending || isUploading}>
          {isPending ? 'Saving...' : 'Save KYS Profile'}
        </Button>
      </div>
    </form>
  );
}
