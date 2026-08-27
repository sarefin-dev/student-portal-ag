'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createStudentAdmin } from './actions';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

export function CreateStudentDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await createStudentAdmin(formData);
    setIsLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Student account created successfully!');
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><UserPlus className="w-4 h-4" /> Create Student</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Student Account</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input name="fullName" required placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" name="email" required placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone (Optional)</Label>
            <Input name="phone" placeholder="+8801700000000" />
          </div>
          <div className="space-y-2">
            <Label>Default Password</Label>
            <Input name="password" required defaultValue="12345678" />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
