'use client';

import { useState, useEffect } from 'react';
import { updateKysAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lock, Unlock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function KysForm({ instructor }: { instructor: any }) {
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(instructor.avatar_url || '');
  const [payoutMethod, setPayoutMethod] = useState(instructor.payout_method || '');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && !anchor.hasAttribute('download') && anchor.target !== '_blank') {
        if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, [isDirty]);

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
      setIsDirty(true);
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
      setIsEditing(false);
      setIsDirty(false);
    }
  }

  return (
    <form action={onSubmit} onChange={() => setIsDirty(true)} className="space-y-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      
      <div className="flex justify-end mb-4">
        <Button 
          type="button" 
          variant={isEditing ? "default" : "outline"}
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {isEditing ? 'Editing Enabled' : 'Enable Editing'}
        </Button>
      </div>

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
              disabled={isUploading || !isEditing}
              className="text-xs"
            />
            {isUploading && <p className="text-xs text-muted-foreground mt-1 text-center">Uploading...</p>}
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" defaultValue={instructor.full_name || ''} placeholder="Instructor Name" readOnly={!isEditing} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Textarea id="address" name="address" defaultValue={instructor.address || ''} placeholder="Full address..." readOnly={!isEditing} className="h-24" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea id="bio" name="bio" defaultValue={instructor.bio || ''} placeholder="Brief biography..." readOnly={!isEditing} className="h-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={instructor.phone || ''} placeholder="+880..." readOnly={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nid_number">NID / Social Proof Number</Label>
              <Input id="nid_number" name="nid_number" defaultValue={instructor.nid_number || ''} readOnly={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertise">Expertise</Label>
              <Input id="expertise" name="expertise" defaultValue={instructor.expertise || ''} placeholder="e.g. React, Node.js" readOnly={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">Interests</Label>
              <Input id="interests" name="interests" defaultValue={instructor.interests || ''} placeholder="e.g. AI, Open Source" readOnly={!isEditing} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <Label htmlFor="social_fb">Facebook (URL)</Label>
          <Input id="social_fb" name="social_fb" type="url" defaultValue={instructor.social_fb || ''} placeholder="https://facebook.com/..." readOnly={!isEditing} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_x">X / Twitter (URL)</Label>
          <Input id="social_x" name="social_x" type="url" defaultValue={instructor.social_x || ''} placeholder="https://x.com/..." readOnly={!isEditing} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_linkedin">LinkedIn (URL)</Label>
          <Input id="social_linkedin" name="social_linkedin" type="url" defaultValue={instructor.social_linkedin || ''} placeholder="https://linkedin.com/in/..." readOnly={!isEditing} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_github">GitHub (URL)</Label>
          <Input id="social_github" name="social_github" type="url" defaultValue={instructor.social_github || ''} placeholder="https://github.com/..." readOnly={!isEditing} />
        </div>
      </div>

      <div className="pt-4 border-t space-y-4">
        <h3 className="text-sm font-semibold">Payout Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payout_method">Preferred Payout Method</Label>
            <Select 
              value={payoutMethod || undefined}
              onValueChange={setPayoutMethod}
              disabled={!isEditing}
              name="payout_method"
            >
              <SelectTrigger id="payout_method">
                <SelectValue placeholder="Select Method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
                <SelectItem value="bank">Bank Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {payoutMethod === 'bkash' && (
            <div className="space-y-2">
              <Label htmlFor="payout_bkash">bKash Number</Label>
              <Input id="payout_bkash" name="payout_bkash" defaultValue={instructor.payout_bkash || ''} placeholder="e.g. 017..." readOnly={!isEditing} required />
            </div>
          )}

          {payoutMethod === 'nagad' && (
            <div className="space-y-2">
              <Label htmlFor="payout_nagad">Nagad Number</Label>
              <Input id="payout_nagad" name="payout_nagad" defaultValue={instructor.payout_nagad || ''} placeholder="e.g. 017..." readOnly={!isEditing} required />
            </div>
          )}

          {payoutMethod === 'bank' && (
            <div className="space-y-2">
              <Label htmlFor="payout_bank">Bank Account Details</Label>
              <Input id="payout_bank" name="payout_bank" defaultValue={instructor.payout_bank || ''} placeholder="Bank Name, Acct No, Branch" readOnly={!isEditing} required />
            </div>
          )}
        </div>
      </div>

      {isEditing && (
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
      )}
    </form>
  );
}
