'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sendStudentNotification } from './actions';
import { toast } from 'sonner';

export function SendNotificationDialog({ 
  studentId, 
  studentName, 
  open, 
  onOpenChange 
}: { 
  studentId: string, 
  studentName: string,
  open: boolean,
  onOpenChange: (open: boolean) => void
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const sendEmail = formData.get('sendEmail') === 'on';

    try {
      const res = await sendStudentNotification(studentId, title, body, sendEmail);
      if (res?.error) {
        toast.error(res.error);
      } else {
        if (res?.warning) {
          toast.warning(res.warning, { duration: 6000 });
        } else {
          toast.success('Message sent successfully!');
        }
        onOpenChange(false);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {studentName}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input name="title" required placeholder="Important Update" />
          </div>
          <div className="space-y-2">
            <Label>Message Body</Label>
            <Textarea name="body" required rows={5} placeholder="Type your message here..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sendEmail" name="sendEmail" defaultChecked className="rounded border-gray-300" />
            <Label htmlFor="sendEmail" className="font-normal cursor-pointer">Also send as Email</Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
